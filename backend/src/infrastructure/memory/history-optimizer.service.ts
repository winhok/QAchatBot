import { Injectable } from '@nestjs/common'
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
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
   * 裁剪历史记录，保留最近的消息
   */
  trim(messages: BaseMessage[], keepLatest = 20): BaseMessage[] {
    if (messages.length <= keepLatest) return messages

    const important = messages.filter((m) => (m as MessageWithMeta).important)
    const recent = messages.slice(-keepLatest)

    const seen = new Set<BaseMessage>()
    return [...important, ...recent].filter((m) => {
      if (seen.has(m)) return false
      seen.add(m)
      return true
    })
  }

  /**
   * 将长对话历史压缩为摘要
   */
  async summarize(messages: BaseMessage[]): Promise<BaseMessage[]> {
    if (messages.length < this.summaryThreshold) return messages

    const older = messages.slice(0, -20)
    const recent = messages.slice(-20)

    const getContentString = (content: unknown): string => {
      if (typeof content === 'string') return content
      if (Array.isArray(content)) {
        return content.map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join(' ')
      }
      return JSON.stringify(content)
    }

    const olderText = older
      .filter((m) => m._getType() !== 'system')
      .map((m) => `${m._getType()}: ${getContentString(m.content)}`)
      .join('\n')

    try {
      const response = await this.model.invoke([
        new SystemMessage('将以下对话历史压缩为简洁摘要，保留关键信息和决策。使用中文回复。'),
        new HumanMessage(olderText),
      ])

      const responseContent = getContentString(response.content)
      const summaryMsg = new SystemMessage(
        `[历史摘要 - 共${older.length}条消息]\n${responseContent}`,
      )

      return [summaryMsg, ...recent]
    } catch (error) {
      console.error('[HistoryOptimizerService] Summarize failed:', error)
      // 如果摘要失败，回退到简单裁剪
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
