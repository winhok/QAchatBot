import { Document } from '@langchain/core/documents'
import { END, Send, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { VectorStoreService } from '../services/vector-store.service'
import { ensureDocumentsUuid } from '../utils'
import { QueryState, ResearcherState, ResearcherStateAnnotation } from './state'

/**
 * 创建 Researcher Graph
 * 实现并行多查询检索
 *
 * 工作流程:
 * 1. generateQueries: 基于原始问题生成多角度查询
 * 2. retrieveInParallel: 并行执行每个查询的检索
 * 3. retrieveDocuments: 单个查询的检索节点（并行执行）
 *
 * @param vectorStore VectorStoreService 实例
 * @param llm ChatOpenAI 实例
 */
export function createResearcherGraph(vectorStore: VectorStoreService, llm: ChatOpenAI) {
  /**
   * 生成多角度查询
   */
  async function generateQueries(state: ResearcherState): Promise<Partial<ResearcherState>> {
    const prompt = `You are an expert at generating search queries for document retrieval.
Given a user question, generate 3-5 different search queries that would help find relevant information.
Each query should approach the question from a different angle or focus on different aspects.

Question: ${state.question}

Output the queries as a JSON array of strings, nothing else.
Example: ["query 1", "query 2", "query 3"]`

    const response = await llm.invoke([
      {
        role: 'system',
        content: 'You are a search query generation expert. Always output valid JSON arrays only.',
      },
      { role: 'user', content: prompt },
    ])

    let queries: string[]
    try {
      const content = (response.content as string).trim()
      // 处理可能的 markdown 代码块包装
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as string[]) : [state.question]
      queries = Array.isArray(parsed) ? parsed : [state.question]
    } catch {
      // 解析失败时使用原始问题
      queries = [state.question]
    }

    return { queries }
  }

  /**
   * 并行分发检索任务
   * 使用 LangGraph Send() 机制实现真正的并行
   */
  function retrieveInParallel(state: ResearcherState): Send[] {
    return state.queries.map(
      (query, index) =>
        new Send('retrieveDocuments', {
          query,
          queryIndex: index,
        } as QueryState),
    )
  }

  /**
   * 单个查询的检索节点
   * 会被并行调用多次
   */
  async function retrieveDocuments(queryState: QueryState): Promise<Partial<ResearcherState>> {
    const { query, queryIndex } = queryState

    // 默认检索参数
    const collection = 'default'
    const topK = 3

    const results = await vectorStore.similaritySearchWithScore(query, topK, collection)

    // 筛选出相关性较高的文档
    const filteredDocs = results.filter(([, score]) => score >= 0.3).map(([doc]) => doc)

    // 确保文档有 UUID 用于去重
    const docsWithUuid = ensureDocumentsUuid(filteredDocs)

    return {
      documents: docsWithUuid,
      completedQueries: [queryIndex],
    }
  }

  // 构建 StateGraph
  const workflow = new StateGraph(ResearcherStateAnnotation)
    .addNode('generateQueries', generateQueries)
    .addNode('retrieveDocuments', retrieveDocuments)
    .addEdge(START, 'generateQueries')
    .addConditionalEdges('generateQueries', retrieveInParallel)
    .addEdge('retrieveDocuments', END)

  return workflow.compile()
}

/**
 * ResearcherGraph 的输入类型
 */
export interface ResearcherGraphInput {
  question: string
  collection?: string
  topK?: number
}

/**
 * ResearcherGraph 的输出类型
 */
export interface ResearcherGraphOutput {
  question: string
  queries: string[]
  documents: Document[]
}
