import { Document } from '@langchain/core/documents';

/**
 * RAG 工作流状态
 */
export interface RagGraphState {
  /** 原始用户查询 */
  query: string;
  /** 重写后的查询（用于检索） */
  rewrittenQuery?: string;
  /** 检索到的文档 */
  documents: Document[];
  /** 文档相关性分数 */
  relevanceScores: number[];
  /** 是否需要重新检索 */
  needsReretrieval: boolean;
  /** 生成的答案 */
  answer?: string;
  /** 答案质量分数 */
  answerQuality?: number;
  /** 检索轮次 */
  retrievalRound: number;
  /** Collection 名称 */
  collection: string;
  /** 最大检索数量 */
  topK: number;
}

/**
 * RAG 节点名称
 */
export const RAG_NODE = {
  QUERY_UNDERSTANDING: 'queryUnderstanding',
  RETRIEVE: 'retrieve',
  EVALUATE_RELEVANCE: 'evaluateRelevance',
  INCREMENT_ROUND: 'incrementRound',
  GENERATE_ANSWER: 'generateAnswer',
  EVALUATE_ANSWER: 'evaluateAnswer',
} as const;

/**
 * 检索后的路由决策
 */
export type RetrievalDecision = 'incrementRound' | 'generateAnswer';
