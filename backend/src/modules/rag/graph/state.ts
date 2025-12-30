import { Document } from '@langchain/core/documents';
import { Annotation } from '@langchain/langgraph';

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
});

export type RagStateType = typeof RagState.State;
