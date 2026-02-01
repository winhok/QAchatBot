/**
 * Core Memory Block Types
 * 参考 Letta 的 Block schema，提供 Agent 可编辑的上下文内记忆
 */

/**
 * 记忆块标签类型
 * 常用值: 'persona', 'human', 'system'
 */
export type MemoryBlockLabel = string

/**
 * 记忆块接口
 * Agent 可通过工具直接编辑这些块
 */
export interface MemoryBlock {
  id: string
  /** 用户 ID */
  userId: string
  /** Agent ID (可选，用于多 Agent 场景) */
  agentId?: string
  /** 块标签，如 'persona', 'human' */
  label: MemoryBlockLabel
  /** 块内容 */
  value: string
  /** 字符限制 (默认 20000) */
  limit: number
  /** 是否只读 */
  readonly: boolean
  /** 块描述 */
  description?: string
  /** 元数据 */
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建记忆块输入
 */
export interface MemoryBlockCreateInput {
  userId: string
  agentId?: string
  label: MemoryBlockLabel
  value?: string
  limit?: number
  readonly?: boolean
  description?: string
}

/**
 * 更新记忆块输入
 */
export interface MemoryBlockUpdateInput {
  value?: string
  limit?: number
  readonly?: boolean
  description?: string
}

/**
 * 记忆块操作结果
 */
export interface MemoryBlockOperationResult {
  success: boolean
  message: string
  block?: MemoryBlock
}

/**
 * 编译后的记忆上下文 (渲染到 System Prompt)
 */
export interface CompiledMemoryContext {
  /** 渲染后的文本 */
  prompt: string
  /** 总字符数 */
  totalChars: number
  /** 块列表 (用于元数据) */
  blocks: Array<{
    label: string
    chars: number
    limit: number
    readonly: boolean
  }>
}

/**
 * 默认块配置
 */
export const DEFAULT_MEMORY_BLOCKS: Array<{
  label: MemoryBlockLabel
  description: string
  defaultValue: string
}> = [
  {
    label: 'persona',
    description:
      'The persona block: Stores details about your current persona, guiding how you behave and respond.',
    defaultValue: '',
  },
  {
    label: 'human',
    description:
      'The human block: Stores key details about the person you are conversing with, allowing for more personalized conversation.',
    defaultValue: '',
  },
]

/**
 * 记忆块字符限制
 */
export const MEMORY_BLOCK_CHAR_LIMIT = 20000
