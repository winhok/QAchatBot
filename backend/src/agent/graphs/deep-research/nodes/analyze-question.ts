import { HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { DeepResearchState } from '../state'
import type { QuestionAnalysis } from '../types'
import { stripJsonFences } from './utils'

/**
 * 分析问题节点
 *
 * 使用 LLM 分析研究问题，提取：
 * - 核心主题
 * - 关键词
 * - 复杂度
 * - 预估时间
 * - 研究方向
 */
export async function analyzeQuestionNode(
  state: DeepResearchState,
  config?: RunnableConfig,
): Promise<Partial<DeepResearchState>> {
  const { question } = state

  const analysisPrompt = `
请分析以下研究问题：${question}

你必须严格按照以下JSON格式返回分析结果，不要添加任何其他文本或解释：

{
  "coreTheme": "问题的核心主题（字符串）",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "complexity": "simple|medium|complex（只能是这三个值之一）",
  "estimatedTime": 预估研究时间（数字，单位：小时）, 
  "researchDirections": ["研究方向1", "研究方向2", "研究方向3"],
  "sourceTypes": ["信息来源类型1", "信息来源类型2", "信息来源类型3"]
}

要求：
1. 只返回JSON对象，不要任何其他文本
2. complexity必须是"simple"、"medium"或"complex"之一
3. estimatedTime必须是数字（小时）
4. 所有数组至少包含2-5个元素
5. 确保JSON格式完全正确，可以被JSON.parse()解析
`

  // 从 config 获取 LLM（由 service 注入）
  const llm = config?.configurable?.llm as
    | { invoke: (messages: unknown[]) => Promise<{ content: unknown }> }
    | undefined
  if (!llm) {
    return {
      status: 'error',
      error: '未配置 LLM',
    }
  }

  const response = await llm.invoke([new HumanMessage(analysisPrompt)])
  const historyMessages = [new HumanMessage(analysisPrompt), response as unknown as HumanMessage]

  try {
    const content = stripJsonFences(String(response.content))
    const analysis: QuestionAnalysis = JSON.parse(content) as QuestionAnalysis
    return {
      analysis,
      status: 'planning',
      progress: 20,
      messages: historyMessages,
    }
  } catch (error: unknown) {
    return {
      status: 'error',
      error: `问题分析失败: ${error instanceof Error ? error.message : String(error)}`,
      messages: historyMessages,
    }
  }
}
