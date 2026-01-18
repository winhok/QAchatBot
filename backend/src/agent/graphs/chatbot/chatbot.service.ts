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
      switch (block.type) {
        case 'text':
          return { type: 'text' as const, text: block.text }
        case 'image_url':
          return {
            type: 'image_url' as const,
            image_url: {
              url: block.image_url.url,
              detail: block.image_url.detail,
            },
          }
        case 'media':
          return {
            type: 'image_url' as const,
            image_url: { url: block.media.url },
          }
        case 'document':
          return {
            type: 'image_url' as const,
            image_url: { url: block.document.url },
          }
      }
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
        console.log('[ChatbotService] Injected enhanced SystemMessage')
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
   */
  async getHistory(threadId: string, modelId?: string): Promise<unknown[]> {
    const app = this.getApp(modelId)
    const state = await app.getState({ configurable: { thread_id: threadId } })
    const values = state?.values as { messages?: unknown[] } | undefined
    return values?.messages || []
  }
}
