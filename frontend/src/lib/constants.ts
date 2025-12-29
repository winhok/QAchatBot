import { Database, Globe, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Model {
  id: string
  name: string
  badge?: string
  description: string
}

export interface Tool {
  id: string
  name: string
  icon: LucideIcon
  enabled: boolean
}

export const MODELS: Array<Model> = [
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    badge: '推荐',
    description: '强大的语言模型',
  },
  { id: 'gpt-4', name: 'GPT-4', description: '稳定可靠' },
]

export const TOOLS: Array<Tool> = [
  { id: 'stategraph', name: 'StateGraph', icon: Globe, enabled: true },
  { id: 'database', name: 'Database Query', icon: Database, enabled: true },
  { id: 'playwright', name: 'Playwright', icon: Wrench, enabled: false },
]
