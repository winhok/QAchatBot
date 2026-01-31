/**
 * 中期记忆类型 (Episodic Memory)
 * 存储在 pgvector 中，支持语义检索
 */

export type EpisodicMemoryType = 'summary' | 'event' | 'interaction' | 'note' | 'relationship'

export interface EpisodicMemory {
  id: string
  userId: string
  sessionId?: string
  type: EpisodicMemoryType
  content: string
  /** 情境描述：何时何地这条记忆可能相关 */
  context: string
  /** 重要性评分 0-1 */
  importance: number
  createdAt: Date
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface EpisodicMemoryCreateInput {
  userId: string
  sessionId?: string
  type: EpisodicMemoryType
  content: string
  context: string
  importance?: number
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

/**
 * 语义搜索结果
 */
export interface EpisodicMemorySearchResult {
  memory: EpisodicMemory
  score: number // 相似度分数
}
