/**
 * Memory Decision Types
 * 用于 LLM 决策记忆操作 (ADD/UPDATE/DELETE/NONE)
 * 参考 mem0 的智能记忆更新机制
 */

/**
 * 记忆操作事件类型
 */
export type MemoryEvent = 'ADD' | 'UPDATE' | 'DELETE' | 'NONE'

/**
 * 单条记忆决策
 */
export interface MemoryDecision {
  /** 操作类型 */
  event: MemoryEvent
  /** 新内容 (ADD/UPDATE 时必填) */
  content?: string
  /** 情境描述 */
  context?: string
  /** 现有记忆 ID (UPDATE/DELETE 时必填) */
  existingId?: string
  /** 之前的内容 (UPDATE/DELETE 时填写) */
  previousContent?: string
  /** 决策理由 */
  reason?: string
  /** 相似度分数 (如有匹配) */
  similarityScore?: number
}

/**
 * 提取的事实
 */
export interface ExtractedFact {
  content: string
  context: string
  importance?: number
}

/**
 * 记忆历史条目
 */
export interface MemoryHistoryEntry {
  id: string
  memoryId: string
  memoryType: 'episodic' | 'block' | 'store'
  userId: string
  event: MemoryEvent
  previousValue: string | null
  newValue: string | null
  actorId?: string // 'user' | 'agent' | 'system'
  metadata?: Record<string, unknown>
  createdAt: Date
}

/**
 * 记忆历史创建输入
 */
export interface MemoryHistoryCreateInput {
  memoryId: string
  memoryType: 'episodic' | 'block' | 'store'
  userId: string
  event: MemoryEvent
  previousValue?: string | null
  newValue?: string | null
  actorId?: string
  metadata?: Record<string, unknown>
}

/**
 * 记忆块历史条目
 */
export interface MemoryBlockHistoryEntry {
  id: string
  blockId: string
  userId: string
  label: string
  event: 'APPEND' | 'REPLACE' | 'RETHINK' | 'DELETE'
  previousValue: string
  newValue: string
  createdAt: Date
}
