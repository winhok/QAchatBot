import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import type { DeepResearchState } from '../state'
import type { ContentSection, ResearchPlan } from '../types'
import { messageContentToString } from './utils'

/**
 * 协调研究节点
 *
 * 使用 ReAct Agent 执行章节研究：
 * - 搜索相关信息
 * - 分析和整理内容
 * - 生成结构化章节内容
 */
export async function coordinateResearchNode(
  state: DeepResearchState & Partial<{ index: number; section: ResearchPlan['sections'][number] }>,
  config?: RunnableConfig,
): Promise<Partial<DeepResearchState>> {
  const { plan, question } = state
  const section = state.section ?? plan?.sections?.[0]
  const sectionIndex = state.index ?? 0

  // 从 config 获取 LLM 和工具
  const llm = config?.configurable?.llm as Parameters<typeof createReactAgent>[0]['llm'] | undefined
  const tools = (config?.configurable?.tools as StructuredToolInterface[]) ?? []

  if (!llm) {
    return {
      status: 'error',
      error: '未配置 LLM',
    }
  }

  const researchPrompt = `你是一个专业的研究专家。请按照以下指示完成章节研究：

重要说明：
- 这是一个单一任务，请一次性完成，不要分步骤或循环
- 直接使用可用的工具完成搜索和内容生成
- 生成完整的章节内容作为最终结果

研究任务：
请完成对指定主题的全面研究，包括：
1. 搜索相关信息和数据
2. 分析和整理内容
3. 生成结构化的章节内容

输出要求：
- 使用 Markdown 格式
- 包含清晰的标题结构
- 提供具体的数据和事实
- 确保内容逻辑连贯、论证充分
- 每个章节应该在合理范围内完整（避免过长或过短）

请直接提供最终的研究成果，不需要额外解释。`

  const researchAgent = createReactAgent({
    llm,
    tools,
    prompt: researchPrompt,
  })

  const researchInput = {
    messages: [
      {
        role: 'user' as const,
        content: `**原始研究问题**：${question}

**当前章节**：
- 标题：${section?.title}
- 描述：${section?.description}
- 优先级：${section?.priority}

**研究要求**：
1. 请围绕原始研究问题"${question}"来展开本章内容
2. 首先搜索相关信息，获取最新和准确的数据
3. 分析信息并生成结构化的内容，确保与原始问题高度相关
4. 使用Markdown格式，包含适当的标题和子标题
5. 确保内容专业、准确、有价值，直接回应原始研究问题
6. 长度适中（通常500-1500字）

**重要提醒**：
- 不要偏离原始研究问题
- 所有内容都必须围绕"${question}"展开
- 提供具体的数据和事实来支持论点

请直接返回完整的章节内容（Markdown格式）。`,
      },
    ],
  }

  let res: ContentSection

  try {
    const result = await researchAgent.invoke(researchInput, {
      recursionLimit: 200,
    })

    const lastMessage = result.messages[result.messages.length - 1]
    const sectionContent = messageContentToString(lastMessage.content)

    res = {
      sectionIndex,
      title: section?.title ?? '未命名章节',
      content: sectionContent,
      timestamp: new Date(),
    }
  } catch (error: unknown) {
    res = {
      sectionIndex,
      title: section?.title ?? '未命名章节',
      content: `**研究失败**：${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date(),
    }
  }

  const totalSections = plan?.sections?.length || 1
  const progressIncrement = (1 / totalSections) * 40

  return {
    generatedContent: [res],
    progress: -progressIncrement, // 负数表示增量
    status: 'executing',
  }
}
