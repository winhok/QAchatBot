import { generateArtifactId, getCanvasSystemPrompt } from '@/agent/prompts'
import { HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { DeepResearchState } from '../state'

/**
 * 生成 Canvas 节点
 *
 * 将所有章节内容整合为可视化的 React 组件：
 * - 使用 Canvas Artifact 格式输出
 * - 支持 TailwindCSS 样式
 * - 生成可交互的研究报告组件
 */
export async function generateCanvasNode(
  state: DeepResearchState,
  config?: RunnableConfig,
): Promise<Partial<DeepResearchState>> {
  const { generatedContent, question } = state
  const messages = Array.isArray(state.messages) ? state.messages : []

  // 从 config 获取 LLM
  const llm = config?.configurable?.llm as
    | { invoke: (messages: unknown[]) => Promise<{ content: unknown }> }
    | undefined

  if (!llm) {
    return {
      status: 'error',
      error: '未配置 LLM',
    }
  }

  const artifactId = generateArtifactId()
  const systemPrompt = getCanvasSystemPrompt(artifactId)

  // 按章节索引排序
  const sortedContent = [...generatedContent].sort((a, b) => a.sectionIndex - b.sectionIndex)

  const reportPrompt = `请基于以下研究问题和章节内容，生成一个可视化的 React 组件，用于展示研究结果。

研究问题：${question}

章节内容：
${sortedContent
  .map(
    (section) => `## ${section.title}
${section.content}`,
  )
  .join('\n\n')}

要求：
1. 必须输出 canvasArtifact 标签，使用系统提供的 artifactId
2. 组件应清晰展示研究结构（标题、章节、要点）
3. 包含章节内容的所有内容不要遗漏
4. 使用 TailwindCSS 完成布局与样式，根据内容合适的排版
5. 不要引用外部库（除 lucide-react）
6. 输出代码后必须添加简短的功能总结
`

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(reportPrompt),
  ])

  const updatedMessages: BaseMessage[] = [
    ...messages,
    new SystemMessage(systemPrompt),
    new HumanMessage(reportPrompt),
    response as unknown as BaseMessage,
  ]

  return {
    finalArtifact: String(response.content),
    status: 'completed',
    progress: 100,
    messages: updatedMessages,
  }
}
