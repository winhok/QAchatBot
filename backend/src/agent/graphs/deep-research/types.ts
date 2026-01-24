/**
 * Deep Research 工作流类型定义
 */

export type ResearchStatus =
  | 'analyzing'
  | 'planning'
  | 'waiting_approval'
  | 'executing'
  | 'generating'
  | 'completed'
  | 'error'

export type PlanApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface QuestionAnalysis {
  coreTheme: string
  keywords: string[]
  complexity: 'simple' | 'medium' | 'complex'
  estimatedTime: number
  researchDirections: string[]
  sourceTypes: string[]
}

export interface ContentSection {
  sectionIndex: number
  title: string
  content: string
  timestamp: Date
}

export interface PlanSection {
  title: string
  description: string
  priority: number
}

export interface ResearchPlan {
  title: string
  description: string
  objectives: string[]
  methodology: string[]
  expectedOutcome: string
  sections: PlanSection[]
}
