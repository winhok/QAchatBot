export type MemoryScope = 'global' | 'folder'
export type MemoryCategory = 'prefs' | 'rules' | 'knowledge' | 'context' | 'profile'

/**
 * 记忆更新模式 (参考 memory-template)
 * - patch: 单一文档持续更新（如用户档案）
 * - insert: 事件型记忆，无限插入（如笔记、关系）
 */
export type UpdateMode = 'patch' | 'insert'

/**
 * 记忆提取任务数据
 * 用于 BullMQ 队列任务
 */
export interface ExtractionJobData {
  userId: string
  sessionId: string
  messages: Array<{ role: string; content: string }>
  schemas: MemorySchema[]
}

export interface MemoryEntry<T = unknown> {
  key: string
  value: T
  scope: MemoryScope
  category: MemoryCategory
  priority?: number
}

export interface MergedMemory {
  prefs: Record<string, unknown>
  rules: string[]
  knowledge: Record<string, unknown>
  context: Record<string, unknown>
  profile?: UserProfile
}

/**
 * 用户档案 (Patch 模式)
 * 长期记忆，单一文档持续更新
 */
export interface UserProfile {
  preferredName?: string
  age?: number
  interests?: string[]
  occupation?: string
  location?: string
  conversationPreferences?: string[]
  relationships?: Array<{
    name: string
    relation: string
    notes?: string
  }>
  lastUpdated: Date
}

/**
 * 记忆 Schema 配置 (参考 memory-template)
 * 用于 LLM 自动提取记忆
 */
export interface MemorySchema {
  name: string
  description: string
  updateMode: UpdateMode
  parameters: Record<string, unknown> // JSON Schema
  systemPrompt?: string
}

/**
 * 默认记忆 Schema 配置
 */
export const DEFAULT_MEMORY_SCHEMAS: MemorySchema[] = [
  {
    name: 'User',
    description:
      'Update this document to maintain up-to-date information about the user in the conversation.',
    updateMode: 'patch',
    parameters: {
      type: 'object',
      properties: {
        preferredName: { type: 'string', description: "The user's preferred name" },
        age: { type: 'integer', description: "The user's age" },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: "A list of the user's interests",
        },
        occupation: { type: 'string', description: "The user's current occupation" },
        location: { type: 'string', description: "The user's location or hometown" },
        conversationPreferences: {
          type: 'array',
          items: { type: 'string' },
          description: "The user's preferred conversation styles, topics to avoid, etc.",
        },
      },
    },
  },
  {
    name: 'Note',
    description: 'Save notable memories the user has shared for later recall.',
    updateMode: 'insert',
    parameters: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description:
            'The situation where this memory may be relevant. Include caveats or conditions.',
        },
        content: {
          type: 'string',
          description: 'The specific information, preference, or event being remembered.',
        },
      },
      required: ['context', 'content'],
    },
  },
]
