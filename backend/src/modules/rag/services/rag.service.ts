import { Document } from '@langchain/core/documents'
import type { BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { VectorStoreService } from './vector-store.service'

/**
 * RAG 查询结果
 */
export interface RagQueryResult {
  answer: string
  sources: Document[]
  relevanceScores: number[]
}

/**
 * RAG 查询选项
 */
export interface RagQueryOptions {
  collection?: string
  topK?: number
  relevanceThreshold?: number
  /** 对话历史，用于智能查询重写 */
  chatHistory?: BaseMessage[]
}

/**
 * RAG 服务
 * 实现检索增强生成的核心逻辑
 */
@Injectable()
export class RagService {
  private llm: ChatOpenAI
  private readonly logger = new Logger(RagService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStore: VectorStoreService,
  ) {
    this.llm = new ChatOpenAI({
      model: this.configService.get<string>('OPENAI_DEFAULT_MODEL') || 'gpt-4o',
      temperature: 0.1,
      configuration: {
        baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      },
    })
  }

  /**
   * 执行 RAG 查询
   */
  async query(question: string, options: RagQueryOptions = {}): Promise<RagQueryResult> {
    const { collection = 'default', topK = 5, relevanceThreshold = 0.3, chatHistory } = options

    this.logger.log({ event: 'rag_query_start', question, collection, topK })

    // 1. 如果有对话历史，重写查询为独立问题
    let searchQuery = question
    if (chatHistory && chatHistory.length > 0) {
      searchQuery = await this.rewriteFollowUpQuery(question, chatHistory)
      this.logger.debug({
        event: 'query_rewritten',
        original: question,
        rewritten: searchQuery,
      })
    }

    // 2. 检索相关文档（带分数）
    const searchResults = await this.vectorStore.similaritySearchWithScore(
      searchQuery,
      topK,
      collection,
    )

    // 3. 过滤低相关性文档
    const filteredResults = searchResults.filter(([, score]) => score >= relevanceThreshold)

    const sources = filteredResults.map(([doc]) => doc)
    const relevanceScores = filteredResults.map(([, score]) => score)

    this.logger.debug({
      event: 'rag_retrieval',
      totalResults: searchResults.length,
      filteredResults: filteredResults.length,
      scores: relevanceScores,
    })

    // 4. 如果没有相关文档，返回默认回答
    if (sources.length === 0) {
      return {
        answer: '抱歉，我没有找到相关的信息来回答您的问题。',
        sources: [],
        relevanceScores: [],
      }
    }

    // 5. 构建 XML 格式上下文
    const context = this.formatDocsAsXml(sources)

    // 6. 生成回答
    const answer = await this.generateAnswer(question, context)

    this.logger.log({
      event: 'rag_query_complete',
      question,
      sourcesCount: sources.length,
    })

    return {
      answer,
      sources,
      relevanceScores,
    }
  }

  /**
   * 将文档格式化为 XML 结构
   * 让 LLM 更容易区分不同来源的上下文
   */
  private formatDocsAsXml(docs: Document[]): string {
    if (docs.length === 0) return '<documents></documents>'

    const formatted = docs
      .map((doc) => {
        const meta = Object.entries(doc.metadata || {})
          .filter(([k]) => ['source', 'title', 'uuid'].includes(k))
          .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
          .join('')
        return `<document${meta}>\n${doc.pageContent}\n</document>`
      })
      .join('\n')

    return `<documents>\n${formatted}\n</documents>`
  }

  /**
   * 生成回答
   */
  private async generateAnswer(question: string, context: string): Promise<string> {
    const systemPrompt = `你是一个专业的技术助手。请基于提供的上下文信息回答用户的问题。

重要规则：
1. 只能基于提供的上下文信息回答问题
2. 如果上下文中没有相关信息，请明确说明"根据提供的资料，未找到相关信息"
3. 回答要准确、简洁、有条理
4. 引用来源时使用 [文档N] 格式标注，并在回答末尾列出引用`

    const userPrompt = `上下文信息：
${context}

用户问题：${question}

请提供一个准确、有帮助的答案：`

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    return response.content as string
  }

  /**
   * 评估文档相关性（用于高级 RAG）
   */
  async evaluateRelevance(query: string, document: Document): Promise<number> {
    const evaluationPrompt = `查询: ${query}
文档内容: ${document.pageContent}

请评估这个文档与查询的相关性，给出 0-1 之间的分数：
- 1.0: 完全相关，直接回答了查询
- 0.7-0.9: 高度相关，包含重要信息
- 0.4-0.6: 中等相关，包含一些有用信息
- 0.1-0.3: 低相关性，信息有限
- 0.0: 完全不相关

只返回数字分数，不要其他内容。`

    const response = await this.llm.invoke([
      {
        role: 'system',
        content: '你是一个文档相关性评估专家，能够准确评估文档与查询的相关性。',
      },
      { role: 'user', content: evaluationPrompt },
    ])

    const score = parseFloat(response.content as string) || 0
    return Math.max(0, Math.min(1, score))
  }

  /**
   * History-Aware 查询重写
   * 将跟进问题结合对话历史重写为独立问题，提高检索精准度
   *
   * @param originalQuery 用户原始查询
   * @param chatHistory 对话历史消息
   * @returns 重写后的独立问题
   */
  async rewriteFollowUpQuery(originalQuery: string, chatHistory: BaseMessage[]): Promise<string> {
    // 首次问题：跳过重写以提升响应速度
    if (chatHistory.length === 0) {
      return originalQuery
    }

    // 只取最近 6 条消息以控制 token 使用
    const recentHistory = chatHistory.slice(-6)
    const historyText = recentHistory
      .map((m) => {
        const role = m._getType() === 'human' ? 'Human' : 'Assistant'
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        return `${role}: ${content.slice(0, 500)}`
      })
      .join('\n')

    const prompt = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
${historyText}

Follow Up Input: ${originalQuery}

Standalone Question:`

    const response = await this.llm.invoke([
      {
        role: 'system',
        content:
          'You are an expert at rephrasing follow-up questions into standalone questions. Output only the rephrased question, nothing else.',
      },
      { role: 'user', content: prompt },
    ])

    const rewritten = (response.content as string).trim()
    this.logger.debug({
      event: 'follow_up_rewritten',
      original: originalQuery,
      rewritten,
      historyLength: chatHistory.length,
    })

    return rewritten || originalQuery
  }
}
