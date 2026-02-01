import { ChatOpenAI } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  DEFAULT_SUMMARIZER_CONFIG,
  SummarizableMessage,
  SummarizationMode,
  SummarizationResult,
  SummarizerConfig,
  SUMMARY_SYSTEM_PROMPT,
  SUMMARY_USER_PROMPT,
} from './summarizer.types'

/**
 * 上下文摘要服务
 * 参考 Letta 的 Summarizer 类
 */
@Injectable()
export class SummarizerService {
  private readonly logger = new Logger(SummarizerService.name)
  private readonly model: ChatOpenAI
  private readonly config: SummarizerConfig

  constructor(private readonly configService: ConfigService) {
    this.model = new ChatOpenAI({
      model: this.configService.get('SUMMARIZER_MODEL', 'gpt-4o-mini'),
      temperature: 0,
      apiKey: this.configService.get('OPENAI_API_KEY'),
      configuration: { baseURL: this.configService.get('OPENAI_BASE_URL') },
    })

    this.config = {
      mode: this.configService.get('SUMMARIZER_MODE', DEFAULT_SUMMARIZER_CONFIG.mode),
      messageBufferLimit: this.configService.get(
        'SUMMARIZER_BUFFER_LIMIT',
        DEFAULT_SUMMARIZER_CONFIG.messageBufferLimit,
      ),
      messageBufferMin: this.configService.get(
        'SUMMARIZER_BUFFER_MIN',
        DEFAULT_SUMMARIZER_CONFIG.messageBufferMin,
      ),
      partialEvictPercentage: this.configService.get(
        'SUMMARIZER_EVICT_PERCENTAGE',
        DEFAULT_SUMMARIZER_CONFIG.partialEvictPercentage,
      ),
    }
  }

  /**
   * 主入口：根据配置执行摘要
   */
  async summarize(messages: SummarizableMessage[], force = false): Promise<SummarizationResult> {
    if (this.config.mode === SummarizationMode.NONE) {
      return { summarized: false, messages, evictedCount: 0 }
    }

    // 检查是否需要摘要
    if (!force && messages.length <= this.config.messageBufferLimit) {
      this.logger.debug(`Buffer not full: ${messages.length}/${this.config.messageBufferLimit}`)
      return { summarized: false, messages, evictedCount: 0 }
    }

    if (this.config.mode === SummarizationMode.STATIC_MESSAGE_BUFFER) {
      return this.staticBufferSummarization(messages, force)
    } else if (this.config.mode === SummarizationMode.PARTIAL_EVICT) {
      return this.partialEvictSummarization(messages, force)
    }

    return { summarized: false, messages, evictedCount: 0 }
  }

  /**
   * 静态缓冲区模式
   * - 保留最近 N 条消息
   * - 驱逐的消息异步存入长期记忆 (fire-and-forget)
   */
  private staticBufferSummarization(
    messages: SummarizableMessage[],
    force: boolean,
  ): SummarizationResult {
    const retainCount = force ? 0 : this.config.messageBufferMin

    // 找到正确的截断点 (确保从 user 消息开始)
    let trimIndex = Math.max(1, messages.length - retainCount)
    while (trimIndex < messages.length && messages[trimIndex].role !== 'user') {
      trimIndex++
    }

    const evictedMessages = messages.slice(1, trimIndex) // 排除 system 消息
    const retainedMessages = [messages[0], ...messages.slice(trimIndex)]

    if (evictedMessages.length === 0) {
      return { summarized: false, messages, evictedCount: 0 }
    }

    this.logger.log(
      `Static buffer: evicting ${evictedMessages.length} messages, retaining ${retainedMessages.length}`,
    )

    // 异步存储摘要到长期记忆 (fire-and-forget)
    this.generateAndStoreSummary(evictedMessages, retainedMessages).catch((err) =>
      this.logger.error(`Background summary failed: ${err}`),
    )

    return {
      summarized: true,
      messages: retainedMessages,
      evictedCount: evictedMessages.length,
    }
  }

  /**
   * 部分驱逐模式
   * - 驱逐一定比例的消息
   * - 生成摘要并作为用户消息注入上下文
   */
  private async partialEvictSummarization(
    messages: SummarizableMessage[],
    force: boolean,
  ): Promise<SummarizationResult> {
    if (!force) {
      return { summarized: false, messages, evictedCount: 0 }
    }

    const totalCount = messages.length
    const targetStart = Math.round((1 - this.config.partialEvictPercentage) * totalCount)

    // 找到 assistant 消息边界
    let assistantIndex = targetStart
    for (let i = targetStart; i < totalCount; i++) {
      if (messages[i].role === 'assistant') {
        assistantIndex = i
        break
      }
    }

    const messagesToSummarize = messages.slice(1, assistantIndex)
    const retainedMessages = messages.slice(assistantIndex)

    if (messagesToSummarize.length === 0) {
      return { summarized: false, messages, evictedCount: 0 }
    }

    this.logger.log(`Partial evict: summarizing ${messagesToSummarize.length} messages`)

    // 同步生成摘要
    const summary = await this.generateSummary(messagesToSummarize, retainedMessages.length)

    // 构建摘要消息
    const summaryMessage: SummarizableMessage = {
      role: 'user',
      content: `[Previous conversation summary]\n${summary}`,
      metadata: { isSummary: true, summarizedCount: messagesToSummarize.length },
    }

    return {
      summarized: true,
      messages: [messages[0], summaryMessage, ...retainedMessages],
      evictedCount: messagesToSummarize.length,
      summary,
    }
  }

  /**
   * 生成摘要
   */
  private async generateSummary(
    messages: SummarizableMessage[],
    retainCount: number,
  ): Promise<string> {
    const transcript = this.formatTranscript(messages)

    const response = await this.model.invoke([
      { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
      { role: 'user', content: SUMMARY_USER_PROMPT(retainCount) },
      { role: 'user', content: `Conversation to summarize:\n${transcript}` },
    ])

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }

  /**
   * 异步生成并存储摘要
   */
  private async generateAndStoreSummary(
    evictedMessages: SummarizableMessage[],
    retainedMessages: SummarizableMessage[],
  ): Promise<void> {
    const summary = await this.generateSummary(evictedMessages, retainedMessages.length)

    // 存储为 episodic memory
    // 这里可以集成到 UnifiedMemoryService
    this.logger.log(`Generated summary: ${summary.slice(0, 100)}...`)
  }

  /**
   * 格式化消息为转录文本
   */
  private formatTranscript(messages: SummarizableMessage[]): string {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
  }
}
