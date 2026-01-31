import { Document } from '@langchain/core/documents'
import { Annotation } from '@langchain/langgraph'
import { reduceDocs } from '../utils'

/**
 * RAG 工作流状态定义
 * 使用 LangGraph Annotation 定义状态结构
 */
export const RagState = Annotation.Root({
  query: Annotation<string>(),
  rewrittenQuery: Annotation<string>(),
  documents: Annotation<Document[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  relevanceScores: Annotation<number[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  needsReretrieval: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  answer: Annotation<string>(),
  answerQuality: Annotation<number>(),
  retrievalRound: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 1,
  }),
  collection: Annotation<string>({
    reducer: (_, update) => update,
    default: () => 'default',
  }),
  topK: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 5,
  }),
})

export type RagStateType = typeof RagState.State

/**
 * 查询状态 - 用于并行检索节点
 */
export interface QueryState {
  query: string
  queryIndex: number
}

/**
 * Researcher Graph 状态定义
 * 用于多查询并行检索工作流
 */
export const ResearcherStateAnnotation = Annotation.Root({
  /** 原始问题 */
  question: Annotation<string>(),

  /** 生成的多角度查询列表 */
  queries: Annotation<string[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  /** 检索到的文档（使用 reduceDocs 去重合并） */
  documents: Annotation<Document[]>({
    reducer: reduceDocs,
    default: () => [],
  }),

  /** 检索完成的查询索引 */
  completedQueries: Annotation<number[]>({
    reducer: (existing, update) => [...(existing ?? []), ...update],
    default: () => [],
  }),

  /** collection 名称 */
  collection: Annotation<string>({
    reducer: (_, update) => update,
    default: () => 'default',
  }),

  /** 每个查询返回的文档数 */
  topK: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 3,
  }),
})

export type ResearcherState = typeof ResearcherStateAnnotation.State
