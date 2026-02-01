/**
 * Context Summarizer Types
 * 参考 Letta 的 summarizer.py 设计
 */

/**
 * 摘要模式
 */
export enum SummarizationMode {
  /**
   * 静态消息缓冲区模式
   * - 保留最近 N 条消息
   * - 旧消息异步存入长期记忆
   * - 不在上下文中注入摘要
   */
  STATIC_MESSAGE_BUFFER = 'static_buffer',

  /**
   * 部分驱逐模式
   * - 当消息超过阈值时，驱逐一定比例的旧消息
   * - 生成摘要并作为用户消息注入上下文
   * - 适合需要保留历史上下文的场景
   */
  PARTIAL_EVICT = 'partial_evict',

  /**
   * 不进行摘要
   */
  NONE = 'none',
}

/**
 * 摘要器配置
 */
export interface SummarizerConfig {
  /** 摘要模式 */
  mode: SummarizationMode

  /** 消息缓冲区上限 (触发摘要的阈值) */
  messageBufferLimit: number

  /** 摘要后保留的最小消息数 */
  messageBufferMin: number

  /** PARTIAL_EVICT 模式下，驱逐的消息比例 (0.0-1.0) */
  partialEvictPercentage: number

  /** 摘要使用的 LLM 模型 */
  summaryModel?: string
}

/**
 * 默认配置
 */
export const DEFAULT_SUMMARIZER_CONFIG: SummarizerConfig = {
  mode: SummarizationMode.STATIC_MESSAGE_BUFFER,
  messageBufferLimit: 30,
  messageBufferMin: 10,
  partialEvictPercentage: 0.3,
}

/**
 * 摘要结果
 */
export interface SummarizationResult {
  /** 是否执行了摘要 */
  summarized: boolean

  /** 更新后的消息列表 */
  messages: SummarizableMessage[]

  /** 被驱逐的消息数量 */
  evictedCount: number

  /** 生成的摘要 (如果有) */
  summary?: string
}

/**
 * 可摘要的消息接口
 */
export interface SummarizableMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  metadata?: Record<string, unknown>
}

/**
 * 摘要提示模板
 */
export const SUMMARY_SYSTEM_PROMPT = `You are a memory-recall helper for an AI assistant. Your task is to summarize the conversation history.

Instructions:
- Extract key facts, decisions, and important information
- Focus on information about the user that should be remembered
- Keep the summary concise but comprehensive
- Use bullet points for clarity
- Preserve any action items or commitments made

Output format: A clear, structured summary in the same language as the conversation.`

export const SUMMARY_USER_PROMPT = (retainCount: number) =>
  retainCount === 0
    ? `You're helping an AI that is about to forget all prior messages. Scan the conversation and write crisp notes that capture any important facts or insights.`
    : `You're helping an AI that can only keep the last ${retainCount} messages. Scan the older messages and write crisp notes of important information so they aren't lost.`
