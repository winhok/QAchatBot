import { Document } from '@langchain/core/documents';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { VectorStoreService } from './vector-store.service';

/**
 * RAG 查询结果
 */
export interface RagQueryResult {
  answer: string;
  sources: Document[];
  relevanceScores: number[];
}

/**
 * RAG 查询选项
 */
export interface RagQueryOptions {
  collection?: string;
  topK?: number;
  relevanceThreshold?: number;
}

/**
 * RAG 服务
 * 实现检索增强生成的核心逻辑
 */
@Injectable()
export class RagService {
  private llm: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStore: VectorStoreService,
    @InjectPinoLogger(RagService.name)
    private readonly logger: PinoLogger,
  ) {
    this.llm = new ChatOpenAI({
      model: this.configService.get<string>('OPENAI_DEFAULT_MODEL') || 'gpt-4o',
      temperature: 0.1,
      configuration: {
        baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      },
    });
  }

  /**
   * 执行 RAG 查询
   */
  async query(
    question: string,
    options: RagQueryOptions = {},
  ): Promise<RagQueryResult> {
    const {
      collection = 'default',
      topK = 5,
      relevanceThreshold = 0.3,
    } = options;

    this.logger.info({ event: 'rag_query_start', question, collection, topK });

    // 1. 检索相关文档（带分数）
    const searchResults = await this.vectorStore.similaritySearchWithScore(
      question,
      topK,
      collection,
    );

    // 2. 过滤低相关性文档
    const filteredResults = searchResults.filter(
      ([, score]) => score >= relevanceThreshold,
    );

    const sources = filteredResults.map(([doc]) => doc);
    const relevanceScores = filteredResults.map(([, score]) => score);

    this.logger.debug({
      event: 'rag_retrieval',
      totalResults: searchResults.length,
      filteredResults: filteredResults.length,
      scores: relevanceScores,
    });

    // 3. 如果没有相关文档，返回默认回答
    if (sources.length === 0) {
      return {
        answer: '抱歉，我没有找到相关的信息来回答您的问题。',
        sources: [],
        relevanceScores: [],
      };
    }

    // 4. 构建上下文
    const context = sources
      .map(
        (doc, index) =>
          `文档 ${index + 1}:\n${doc.pageContent}`,
      )
      .join('\n\n---\n\n');

    // 5. 生成回答
    const answer = await this.generateAnswer(question, context);

    this.logger.info({
      event: 'rag_query_complete',
      question,
      sourcesCount: sources.length,
    });

    return {
      answer,
      sources,
      relevanceScores,
    };
  }

  /**
   * 生成回答
   */
  private async generateAnswer(
    question: string,
    context: string,
  ): Promise<string> {
    const systemPrompt = `你是一个专业的技术助手。请基于提供的上下文信息回答用户的问题。

重要规则：
1. 只能基于提供的上下文信息回答问题
2. 如果上下文中没有相关信息，请明确说明
3. 回答要准确、简洁、有条理
4. 可以引用具体的文档来源`;

    const userPrompt = `上下文信息：
${context}

用户问题：${question}

请提供一个准确、有帮助的答案：`;

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return response.content as string;
  }

  /**
   * 评估文档相关性（用于高级 RAG）
   */
  async evaluateRelevance(
    query: string,
    document: Document,
  ): Promise<number> {
    const evaluationPrompt = `查询: ${query}
文档内容: ${document.pageContent}

请评估这个文档与查询的相关性，给出 0-1 之间的分数：
- 1.0: 完全相关，直接回答了查询
- 0.7-0.9: 高度相关，包含重要信息
- 0.4-0.6: 中等相关，包含一些有用信息
- 0.1-0.3: 低相关性，信息有限
- 0.0: 完全不相关

只返回数字分数，不要其他内容。`;

    const response = await this.llm.invoke([
      {
        role: 'system',
        content:
          '你是一个文档相关性评估专家，能够准确评估文档与查询的相关性。',
      },
      { role: 'user', content: evaluationPrompt },
    ]);

    const score = parseFloat(response.content as string) || 0;
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 重写查询（用于提高检索效果）
   */
  async rewriteQuery(originalQuery: string): Promise<string> {
    const rewritePrompt = `原始查询: ${originalQuery}

请重写这个查询以提高检索效果，使其更具体、更清晰：

重写后的查询:`;

    const response = await this.llm.invoke([
      {
        role: 'system',
        content: '你是一个查询优化专家，擅长重写查询以提高信息检索的效果。',
      },
      { role: 'user', content: rewritePrompt },
    ]);

    return response.content as string;
  }
}
