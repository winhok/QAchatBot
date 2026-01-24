/**
 * 人格配置模块
 */

export interface PersonaConfig {
  name: string
  role: string
  personality: string
  language: string
  specialties: string[]
}

export const DEFAULT_PERSONA: PersonaConfig = {
  name: 'AI 助手',
  role: '智能助手',
  personality: '友好、专业',
  language: '中文',
  specialties: [],
}
