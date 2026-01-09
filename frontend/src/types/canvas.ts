/**
 * Canvas 功能类型定义
 *
 * 定义 Canvas Artifact 的所有数据结构和类型
 */

/**
 * Artifact 类型（决定如何执行）
 * react: React 组件
 * component: 通用组件别名（等同于 react）
 */
export type CanvasType = 'react' | 'component'

/**
 * 代码语言（语法高亮）
 * 当前版本仅支持 JSX
 */
export type CanvasLanguage = 'jsx'

/**
 * Artifact 状态
 */
export type CanvasStatus = 'creating' | 'streaming' | 'ready' | 'executing' | 'error'

/**
 * Artifact 代码信息
 */
export interface CanvasCode {
  language: CanvasLanguage
  content: string
}

/**
 * Canvas Artifact 完整数据结构
 */
export interface CanvasArtifact {
  // 元数据
  id: string
  type: CanvasType
  title: string

  // 代码信息
  code: CanvasCode

  // 状态信息
  status: CanvasStatus
  isStreaming: boolean

  // 关联信息
  messageId: string
  sessionId: string

  // 版本信息
  currentVersion: number

  // 时间戳
  createdAt: Date
  updatedAt: Date

  // 执行结果（可选）
  executionResult?: {
    output: unknown
    error: string
    console: string[]
  }
}

/**
 * Store 状态接口
 */
export interface CanvasState {
  // 状态
  artifacts: Map<string, Map<string, CanvasArtifact>> // messageId -> artifactId -> Artifact
  activeArtifactId: string | null
  isCanvasVisible: boolean
  initialTab: 'editor' | 'preview'

  // Actions
  createArtifact: (
    messageId: string,
    data: { id: string; type: CanvasType; title: string; sessionId: string },
  ) => void
  updateArtifact: (messageId: string, artifactId: string, updates: Partial<CanvasArtifact>) => void
  startCode: (messageId: string, artifactId: string, language: CanvasLanguage) => void
  appendCodeChunk: (messageId: string, artifactId: string, chunk: string) => void
  endCode: (messageId: string, artifactId: string, fullContent: string) => void

  setActiveArtifactId: (id: string | null) => void
  setIsCanvasVisible: (visible: boolean, initialTab?: 'editor' | 'preview') => void
  getArtifact: (messageId: string, artifactId: string) => CanvasArtifact | undefined
  restoreArtifactsFromMessage: (messageId: string, content: string) => void
  clear: () => void
}
