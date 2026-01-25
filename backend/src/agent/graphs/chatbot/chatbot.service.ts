import {
  buildChatbotSystemPrompt,
  DEFAULT_PERSONA,
  generateArtifactId,
  getCanvasSystemPrompt,
  type PersonaConfig,
} from '@/agent/prompts'
import { ToolsService } from '@/agent/tools'
import { ModelFactory } from '@/agent/utils'
import { getDatabaseUrl } from '@/config/database-url'
import { HistoryOptimizerService } from '@/infrastructure/memory/history-optimizer.service'
import { MemoryStoreService, type MergedMemory } from '@/infrastructure/memory/memory-store.service'
import type { ChatMessageContentBlock } from '@/shared/schemas/content-blocks'
import type { ChatMessageContent } from '@/shared/schemas/requests'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** LangGraph message structure with checkpoint metadata */
interface LangGraphMessage {
  id?: string
  kwargs?: {
    id?: string
    content?: string
    checkpoint_id?: string
    parent_checkpoint_id?: string
    additional_kwargs?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface CheckpointInfo {
  checkpointId: string
  parentCheckpointId?: string
}

@Injectable()
export class ChatbotService implements OnModuleInit {
  /** 工作流缓存最大数量 */
  private readonly MAX_CACHE_SIZE = 10
  private checkpointer: PostgresSaver
  private appCache = new Map<string, ReturnType<typeof this.compileWorkflow>>()
  private currentPersona: Partial<PersonaConfig> = {}

  constructor(
    private readonly config: ConfigService,
    private readonly tools: ToolsService,
    private readonly memoryStore: MemoryStoreService,
    private readonly historyOptimizer: HistoryOptimizerService,
    private readonly modelFactory: ModelFactory,
  ) {}

  async onModuleInit() {
    const databaseUrl = getDatabaseUrl()
    this.checkpointer = PostgresSaver.fromConnString(databaseUrl)
    try {
      await this.checkpointer.setup()
    } catch (error: unknown) {
      // Ignore duplicate key error when tables already exist
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log('[ChatbotService] Checkpoint tables already exist')
      } else {
        throw error
      }
    }
    console.log('[ChatbotService] Checkpointer initialized')
  }

  /**
   * 设置人格配置
   */
  setPersona(persona: Partial<PersonaConfig>) {
    this.currentPersona = persona
    // 清除缓存，下次会用新的人格重新编译
    this.appCache.clear()
    console.log('[ChatbotService] Persona updated:', persona.name || 'default')
  }

  /**
   * 获取当前人格配置
   */
  getPersona(): PersonaConfig {
    return { ...DEFAULT_PERSONA, ...this.currentPersona }
  }

  /**
   * 获取基础系统指令
   */
  private getBaseSystemPrompt(): string {
    const toolNames = this.tools.getEnabledToolNames()
    return buildChatbotSystemPrompt(this.currentPersona, toolNames)
  }

  /**
   * Build enhanced system prompt with layered memory
   */
  private buildEnhancedSystemPrompt(memory: MergedMemory): string {
    const parts: string[] = [this.getBaseSystemPrompt()]

    const hasEntries = (obj: Record<string, unknown>) => Object.keys(obj).length > 0

    // User preferences
    if (hasEntries(memory.prefs)) {
      parts.push('\n## 用户偏好')
      parts.push(...Object.entries(memory.prefs).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`))
    }

    // Behavior rules
    if (memory.rules.length > 0) {
      parts.push('\n## 行为规则')
      parts.push(...memory.rules.map((r: string) => `- ${r}`))
    }

    // Project context
    if (hasEntries(memory.context)) {
      parts.push('\n## 项目上下文', JSON.stringify(memory.context, null, 2))
    }

    // Domain knowledge
    if (hasEntries(memory.knowledge)) {
      parts.push('\n## 领域知识', JSON.stringify(memory.knowledge, null, 2))
    }

    // Canvas system prompt
    parts.push(getCanvasSystemPrompt(generateArtifactId()))

    return parts.join('\n')
  }

  createHumanMessage(message: ChatMessageContent): HumanMessage {
    if (typeof message === 'string') {
      return new HumanMessage(message)
    }

    const content = message.map((block: ChatMessageContentBlock) => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text }
      }
      if (block.type === 'image_url') {
        return {
          type: 'image_url' as const,
          image_url: { url: block.image_url.url, detail: block.image_url.detail },
        }
      }
      // media and document types use same structure
      const url = block.type === 'media' ? block.media.url : block.document.url
      return { type: 'image_url' as const, image_url: { url } }
    })

    return new HumanMessage({ content })
  }

  /**
   * 创建模型实例
   * 支持 "provider:modelName" 格式，如 "openai:gpt-4o" 或 "google:gemini-2.5-flash"
   */
  private createModelInstance(modelId: string) {
    console.log(`[ChatbotService] Creating model: ${modelId}`)
    return this.modelFactory.createModel(modelId)
  }

  /**
   * 编译带工具的工作流
   */
  private compileWorkflow(modelId: string) {
    const allTools = this.tools.getAllTools()
    const model = this.createModelInstance(modelId).bindTools(allTools)
    const toolNode = new ToolNode(allTools)

    // 创建闭包引用
    const memoryStore = this.memoryStore
    const historyOptimizer = this.historyOptimizer
    const buildEnhancedSystemPrompt = (memory: MergedMemory) =>
      this.buildEnhancedSystemPrompt(memory)

    const chatbotNode = async (state: typeof MessagesAnnotation.State, config: RunnableConfig) => {
      const threadId = config.configurable?.thread_id as string
      const userId = config.configurable?.user_id as string | undefined

      // 1. 获取合并后的分层记忆
      const mergedMemory = await memoryStore.getMergedMemoryForSession(threadId, userId)

      // 2. 构建增强系统提示
      const enhancedPrompt = buildEnhancedSystemPrompt(mergedMemory)

      // 3. 优化历史记录
      let messagesToSend = await historyOptimizer.optimize(state.messages)

      // 4. 检查是否已有 SystemMessage（避免重复注入）
      const hasSystemMessage = messagesToSend.some((msg) => msg._getType() === 'system')

      if (!hasSystemMessage) {
        // 首次对话，注入系统指令
        messagesToSend = [new SystemMessage(enhancedPrompt), ...messagesToSend]
      }

      console.log('[ChatbotService] Invoking model with', messagesToSend.length, 'messages')

      try {
        const res = await model.invoke(messagesToSend)
        console.log('[ChatbotService] Model response received')
        return { messages: [res] }
      } catch (error) {
        console.error('[ChatbotService] Model invoke error:', error)
        throw error
      }
    }

    const shouldContinue = (state: typeof MessagesAnnotation.State) => {
      const lastMessage = state.messages[state.messages.length - 1] as AIMessage
      if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return 'tools'
      }
      return END
    }

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('chatbot', chatbotNode)
      .addNode('tools', toolNode)
      .addEdge(START, 'chatbot')
      .addConditionalEdges('chatbot', shouldContinue, ['tools', END])
      .addEdge('tools', 'chatbot')

    return workflow.compile({ checkpointer: this.checkpointer })
  }

  /**
   * 获取 App 实例（带缓存）
   *
   * 缓存 key 格式：modelId-toolId1,toolId2,...
   * 采用 FIFO 策略，超过 MAX_CACHE_SIZE 时淘汰最早的缓存
   *
   * @param modelId 模型 ID
   * @param toolIds 可选的工具 ID 列表（用于缓存区分）
   */
  getApp(modelId: string = 'gpt-4o', toolIds?: string[]) {
    // 生成包含工具组合的缓存 key
    const cacheKey = `${modelId}-${(toolIds || []).sort().join(',')}`

    if (!this.appCache.has(cacheKey)) {
      // FIFO 淘汰策略
      if (this.appCache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.appCache.keys().next().value as string | undefined
        if (firstKey) {
          this.appCache.delete(firstKey)
          console.log(`[ChatbotService] Cache evicted: ${firstKey}`)
        }
      }

      console.log(`[ChatbotService] Creating app for: ${cacheKey}`)
      this.appCache.set(cacheKey, this.compileWorkflow(modelId))
    }
    return this.appCache.get(cacheKey)!
  }

  /**
   * 获取聊天历史
   * @param threadId 会话线程 ID
   * @param checkpointId 可选的 checkpoint ID，用于获取指定分支的历史
   * @param modelId 模型 ID
   */
  async getHistory(
    threadId: string,
    checkpointId?: string,
    modelId?: string,
  ): Promise<{
    messages: unknown[]
    checkpointId?: string
    parentCheckpointId?: string
  }> {
    const app = this.getApp(modelId)
    const config = {
      configurable: {
        thread_id: threadId,
        ...(checkpointId && { checkpoint_id: checkpointId }),
      },
    }

    const state = await app.getState(config)
    const messages = (state?.values as { messages?: LangGraphMessage[] })?.messages || []

    if (messages.length === 0) {
      return {
        messages: [],
        checkpointId: state?.config?.configurable?.checkpoint_id as string | undefined,
      }
    }

    // Build message-to-checkpoint mapping from state history
    const messageCheckpointMap = await this.buildMessageCheckpointMap(app, config)

    // Inject checkpoint info into messages
    const enhancedMessages = messages.map((msg) =>
      this.injectCheckpointInfo(msg, messageCheckpointMap),
    )

    return {
      messages: enhancedMessages,
      checkpointId: state?.config?.configurable?.checkpoint_id as string | undefined,
      parentCheckpointId: state?.parentConfig?.configurable?.checkpoint_id as string | undefined,
    }
  }

  private async buildMessageCheckpointMap(
    app: ReturnType<typeof this.compileWorkflow>,
    config: { configurable: { thread_id: string; checkpoint_id?: string } },
  ): Promise<Map<string, CheckpointInfo>> {
    const map = new Map<string, CheckpointInfo>()

    try {
      for await (const snapshot of app.getStateHistory(config)) {
        const snapshotMessages =
          (snapshot.values as { messages?: LangGraphMessage[] })?.messages || []
        const snapshotCheckpointId = snapshot.config.configurable?.checkpoint_id as
          | string
          | undefined
        const snapshotParentCheckpointId = snapshot.parentConfig?.configurable?.checkpoint_id as
          | string
          | undefined

        if (snapshotMessages.length === 0 || !snapshotCheckpointId) continue

        const lastMessage = snapshotMessages[snapshotMessages.length - 1]
        const msgId = lastMessage.id || lastMessage.kwargs?.id
        if (msgId && !map.has(msgId)) {
          map.set(msgId, {
            checkpointId: snapshotCheckpointId,
            parentCheckpointId: snapshotParentCheckpointId,
          })
        }
      }
    } catch (error) {
      console.warn('[ChatbotService] Failed to retrieve state history for checkpoints:', error)
    }

    return map
  }

  private injectCheckpointInfo(
    msg: LangGraphMessage,
    checkpointMap: Map<string, CheckpointInfo>,
  ): LangGraphMessage {
    const msgId = msg.id || msg.kwargs?.id
    if (!msgId || !checkpointMap.has(msgId)) return msg

    const cpInfo = checkpointMap.get(msgId)!
    if (!msg.kwargs) msg.kwargs = {}
    if (!msg.kwargs.additional_kwargs) msg.kwargs.additional_kwargs = {}

    msg.kwargs.checkpoint_id = cpInfo.checkpointId
    msg.kwargs.additional_kwargs.checkpoint_id = cpInfo.checkpointId

    if (cpInfo.parentCheckpointId) {
      msg.kwargs.parent_checkpoint_id = cpInfo.parentCheckpointId
      msg.kwargs.additional_kwargs.parent_checkpoint_id = cpInfo.parentCheckpointId
    }

    return msg
  }

  /**
   * 获取 checkpoint 历史列表
   */
  async getCheckpoints(
    threadId: string,
    modelId?: string,
  ): Promise<
    Array<{
      checkpointId: string
      parentCheckpointId: string | null
      timestamp: string
      preview: string
      messageCount: number
    }>
  > {
    const app = this.getApp(modelId)
    const checkpoints: Array<{
      checkpointId: string
      parentCheckpointId: string | null
      timestamp: string
      preview: string
      messageCount: number
    }> = []

    for await (const state of app.getStateHistory({ configurable: { thread_id: threadId } })) {
      const checkpointId = state.config?.configurable?.checkpoint_id as string | undefined
      if (!checkpointId) continue

      const parentCheckpointId =
        (state.parentConfig?.configurable?.checkpoint_id as string | undefined) || null
      const messages = (state.values as { messages?: Array<{ content?: string }> })?.messages || []
      const lastMessage = messages[messages.length - 1]
      const preview =
        typeof lastMessage?.content === 'string' ? lastMessage.content.slice(0, 100) : ''

      checkpoints.push({
        checkpointId,
        parentCheckpointId,
        timestamp: state.createdAt || new Date().toISOString(),
        preview,
        messageCount: messages.length,
      })
    }

    return checkpoints
  }

  /**
   * 从指定 checkpoint 获取状态
   */
  async getStateAtCheckpoint(threadId: string, checkpointId: string, modelId?: string) {
    const app = this.getApp(modelId)
    return app.getState({
      configurable: { thread_id: threadId, checkpoint_id: checkpointId },
    })
  }

  /**
   * 获取指定 checkpoint 的同级分支列表
   * 用于实现 LobeChat 风格的分支选择器 (1/3, 2/3, 3/3)
   */
  async getBranches(
    threadId: string,
    targetCheckpointId: string,
    modelId?: string,
  ): Promise<{
    branches: Array<{
      checkpointId: string
      preview: string
      createdAt: string
      isCurrent: boolean
    }>
    currentIndex: number
    total: number
  }> {
    const app = this.getApp(modelId)

    // 1. 获取目标 checkpoint 的状态，找到其 parentCheckpointId
    const targetState = await app.getState({
      configurable: { thread_id: threadId, checkpoint_id: targetCheckpointId },
    })
    const parentCheckpointId = targetState?.parentConfig?.configurable?.checkpoint_id as
      | string
      | undefined

    // 2. 遍历历史，找出所有共享同一 parent 的 checkpoints（同级分支）
    const siblings: Array<{
      checkpointId: string
      preview: string
      createdAt: string
    }> = []

    for await (const state of app.getStateHistory({ configurable: { thread_id: threadId } })) {
      const cpId = state.config?.configurable?.checkpoint_id as string | undefined
      const parentCpId = state.parentConfig?.configurable?.checkpoint_id as string | undefined

      // 匹配共享同一父节点的 checkpoints
      if (parentCpId === parentCheckpointId && cpId) {
        const messages =
          (state.values as { messages?: Array<{ content?: string }> })?.messages || []
        const lastMsg = messages[messages.length - 1]

        siblings.push({
          checkpointId: cpId,
          preview: typeof lastMsg?.content === 'string' ? lastMsg.content.slice(0, 50) : '',
          createdAt: state.createdAt || new Date().toISOString(),
        })
      }
    }

    // 按时间排序（最早的在前）
    siblings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const currentIndex = siblings.findIndex((s) => s.checkpointId === targetCheckpointId)

    return {
      branches: siblings.map((s) => ({
        ...s,
        isCurrent: s.checkpointId === targetCheckpointId,
      })),
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      total: siblings.length,
    }
  }

  /**
   * 获取分支数量
   * 用于侧边栏显示会话的分支数量徽章
   */
  async getBranchCount(threadId: string, modelId?: string): Promise<number> {
    const app = this.getApp(modelId)
    const config = { configurable: { thread_id: threadId } }

    // 统计有多少个不同的 parent checkpoint（即分叉点）
    const parentCheckpoints = new Set<string>()
    let totalCheckpoints = 0

    try {
      for await (const state of app.getStateHistory(config)) {
        totalCheckpoints++
        const parentCpId = state.parentConfig?.configurable?.checkpoint_id as string | undefined
        if (parentCpId) {
          parentCheckpoints.add(parentCpId)
        }
      }
    } catch (error) {
      console.warn('[ChatbotService] Failed to get branch count:', error)
      return 1
    }

    // 分支数 = 总 checkpoint 数 - 不同的 parent 数 + 1（主分支）
    // 如果一个 parent 有多个子 checkpoint，说明有分叉
    // 简化：分支数 = 总 checkpoint 数减去线性 checkpoint 数
    // 更简单的计算：如果 checkpoints > parentCheckpoints.size，有分支
    if (totalCheckpoints <= 1) return 1

    // 分支数 = 总数 - 唯一 parent 数（有分叉时，parent 会有多个子节点）
    const branchCount = totalCheckpoints - parentCheckpoints.size
    return Math.max(1, branchCount)
  }

  /**
   * 构建对话树结构
   * 用于全屏时间线可视化
   */
  async buildTree(
    threadId: string,
    modelId?: string,
  ): Promise<{
    nodes: Array<{
      checkpointId: string
      parentCheckpointId: string | null
      preview: string
      messageCount: number
      createdAt: string
      role: 'user' | 'assistant'
    }>
  }> {
    const app = this.getApp(modelId)
    const nodes: Array<{
      checkpointId: string
      parentCheckpointId: string | null
      preview: string
      messageCount: number
      createdAt: string
      role: 'user' | 'assistant'
    }> = []

    try {
      for await (const state of app.getStateHistory({ configurable: { thread_id: threadId } })) {
        const checkpointId = state.config?.configurable?.checkpoint_id as string | undefined
        if (!checkpointId) continue

        const parentCheckpointId =
          (state.parentConfig?.configurable?.checkpoint_id as string | undefined) || null
        const messages =
          (state.values as { messages?: Array<{ content?: string; _getType?: () => string }> })
            ?.messages || []
        const lastMessage = messages[messages.length - 1]

        // 判断最后一条消息的角色
        let role: 'user' | 'assistant' = 'assistant'
        if (lastMessage) {
          const msgType =
            typeof lastMessage._getType === 'function' ? lastMessage._getType() : undefined
          if (msgType === 'human') {
            role = 'user'
          }
        }

        const preview =
          typeof lastMessage?.content === 'string' ? lastMessage.content.slice(0, 50) : ''

        nodes.push({
          checkpointId,
          parentCheckpointId,
          preview,
          messageCount: messages.length,
          createdAt: state.createdAt || new Date().toISOString(),
          role,
        })
      }
    } catch (error) {
      console.warn('[ChatbotService] Failed to build tree:', error)
    }

    // 按创建时间正序排列（最早的在前）
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return { nodes }
  }

  /**
   * 对比两个分支的消息差异
   */
  async getDiff(
    threadId: string,
    checkpointA: string,
    checkpointB: string,
    modelId?: string,
  ): Promise<{
    branchA: {
      checkpointId: string
      messages: Array<{ role: string; content: string }>
    }
    branchB: {
      checkpointId: string
      messages: Array<{ role: string; content: string }>
    }
    commonAncestor: string | null
  }> {
    // 获取两个分支的完整历史
    const [historyA, historyB] = await Promise.all([
      this.getHistory(threadId, checkpointA, modelId),
      this.getHistory(threadId, checkpointB, modelId),
    ])

    // 转换消息格式
    const transformMessages = (messages: unknown[]): Array<{ role: string; content: string }> => {
      return messages.map((msg: unknown) => {
        const m = msg as {
          _getType?: () => string
          kwargs?: { content?: string }
          content?: string
        }

        let role = 'unknown'
        if (typeof m._getType === 'function') {
          const type = m._getType()
          if (type === 'human') {
            role = 'user'
          } else if (type === 'ai') {
            role = 'assistant'
          } else {
            role = type
          }
        }

        let content = ''
        if (typeof m.content === 'string') {
          content = m.content
        } else if (typeof m.kwargs?.content === 'string') {
          content = m.kwargs.content
        }

        return { role, content }
      })
    }

    // 查找共同祖先
    // 构建 A 的祖先链
    const ancestorsA = new Set<string>()
    let currentCp = checkpointA
    const checkpoints = await this.getCheckpoints(threadId, modelId)
    const cpMap = new Map(checkpoints.map((cp) => [cp.checkpointId, cp.parentCheckpointId]))

    while (currentCp) {
      ancestorsA.add(currentCp)
      const parent = cpMap.get(currentCp)
      if (!parent) break
      currentCp = parent
    }

    // 从 B 向上遍历找交汇点
    let commonAncestor: string | null = null
    currentCp = checkpointB
    while (currentCp) {
      if (ancestorsA.has(currentCp)) {
        commonAncestor = currentCp
        break
      }
      const parent = cpMap.get(currentCp)
      if (!parent) break
      currentCp = parent
    }

    return {
      branchA: {
        checkpointId: checkpointA,
        messages: transformMessages(historyA.messages),
      },
      branchB: {
        checkpointId: checkpointB,
        messages: transformMessages(historyB.messages),
      },
      commonAncestor,
    }
  }
}
