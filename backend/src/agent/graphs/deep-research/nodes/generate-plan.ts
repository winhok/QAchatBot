import { HumanMessage, type BaseMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { planSchema, type DeepResearchState } from '../state'

/**
 * 生成研究计划节点
 *
 * 基于问题分析结果，使用结构化输出生成研究计划，包括：
 * - 标题和描述
 * - 研究目标
 * - 研究方法
 * - 章节规划
 */
export async function generatePlanNode(
  state: DeepResearchState,
  config?: RunnableConfig,
): Promise<Partial<DeepResearchState>> {
  const { question, analysis, userFeedback } = state
  const messages = Array.isArray(state.messages) ? state.messages : []
  const isFirstPlan = !state.userFeedback

  const planPrompt = `
你是严谨的研究策划助手。基于问题分析结果，输出一份可执行的研究计划。

问题：${question}
分析：${JSON.stringify(analysis, null, 2)}

要求：
1) 输出内容必须符合给定结构化 schema。
2) 标题与描述要具体可检索，避免空泛表述。
3) objectives/methodology 使用动词短语，清晰可执行。
4) sections 至少 3 个，按 priority 从高到低排序，且覆盖主要研究方向。
5) 不要输出多余文本或解释。
`

  // 从 config 获取 LLM（由 service 注入）
  const llm = config?.configurable?.llm as
    | {
        withStructuredOutput: (
          schema: unknown,
          options: { name: string; includeRaw: boolean },
        ) => { invoke: (messages: unknown[]) => Promise<{ parsed: unknown; raw: unknown }> }
      }
    | undefined

  if (!llm) {
    return {
      status: 'error',
      error: '未配置 LLM',
    }
  }

  const promptMessages = isFirstPlan
    ? [...messages, new HumanMessage(planPrompt)]
    : [...messages, new HumanMessage(userFeedback)]

  const structuredLlm = llm.withStructuredOutput(planSchema, {
    name: 'research_plan',
    includeRaw: true,
  })

  try {
    const plan = await structuredLlm.invoke(promptMessages)
    const historyMessages: BaseMessage[] = [...promptMessages, plan.raw as BaseMessage]

    return {
      plan: plan.parsed as DeepResearchState['plan'],
      status: 'waiting_approval',
      progress: 30,
      approvalStatus: 'pending',
      userFeedback: '',
      messages: historyMessages,
    }
  } catch (error: unknown) {
    return {
      status: 'error',
      error: `计划生成失败: ${error instanceof Error ? error.message : String(error)}`,
      userFeedback: '',
      messages: promptMessages,
    }
  }
}
