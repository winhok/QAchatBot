import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface MessageWithMeta extends BaseMessage {
  important?: boolean
}

@Injectable()
export class HistoryOptimizerService {
  private readonly maxLength = 30
  private readonly summaryThreshold = 40
  private model: ChatOpenAI

  constructor(private config: ConfigService) {
    this.model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
      apiKey: this.config.get('OPENAI_API_KEY'),
      configuration: { baseURL: this.config.get('OPENAI_BASE_URL') },
    })
  }

  /**
   * Convert message content to string representation
   */
  private getContentString(content: unknown): string {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content.map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join(' ')
    }
    return JSON.stringify(content)
  }

  /**
   * Trim history, keeping recent and important messages
   */
  trim(messages: BaseMessage[], keepLatest = 20): BaseMessage[] {
    if (messages.length <= keepLatest) return messages

    const important = messages.filter((m) => (m as MessageWithMeta).important)
    const recent = messages.slice(-keepLatest)

    // Deduplicate while preserving order
    const seen = new Set<BaseMessage>()
    return [...important, ...recent].filter((m) => {
      if (seen.has(m)) return false
      seen.add(m)
      return true
    })
  }

  /**
   * Compress long conversation history into a summary
   */
  async summarize(messages: BaseMessage[]): Promise<BaseMessage[]> {
    if (messages.length < this.summaryThreshold) return messages

    const older = messages.slice(0, -20)
    const recent = messages.slice(-20)

    const olderText = older
      .filter((m) => m._getType() !== 'system')
      .map((m) => `${m._getType()}: ${this.getContentString(m.content)}`)
      .join('\n')

    try {
      const response = await this.model.invoke([
        new SystemMessage(
          '将以下对话历史压缩为简洁摘要。要求：1. 保留关键决策和结论 2. 保留重要的技术细节 3. 省略寒暄和重复内容 4. 使用中文，简明扼要',
        ),
        new HumanMessage(olderText),
      ])

      const responseContent = this.getContentString(response.content)
      const summaryMsg = new SystemMessage(
        `[历史摘要 - 共${older.length}条消息]\n${responseContent}`,
      )

      return [summaryMsg, ...recent]
    } catch (error) {
      console.error('[HistoryOptimizerService] Summarize failed:', error)
      return this.trim(messages, this.maxLength)
    }
  }

  /**
   * 优化历史记录（裁剪 + 摘要）
   */
  async optimize(messages: BaseMessage[]): Promise<BaseMessage[]> {
    if (messages.length <= this.maxLength) return messages
    const summarized = await this.summarize(messages)
    return this.trim(summarized, this.maxLength)
  }
}
