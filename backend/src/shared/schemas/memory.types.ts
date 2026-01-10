export type MemoryScope = 'global' | 'folder'
export type MemoryCategory = 'prefs' | 'rules' | 'knowledge' | 'context'

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
}
