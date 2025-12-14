export type ToolStatus = 'running' | 'success' | 'error'

export interface ToolCallData {
  id: string
  name: string
  type: 'api' | 'database' | 'script'
  status: ToolStatus
  duration?: number
  input?: Record<string, unknown>
  output?: Record<string, unknown>
}

export interface ApiResultData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  statusCode: number
  duration: number
  responseBody: unknown
  headers?: Record<string, string>
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isStreaming?: boolean
  toolCalls?: ToolCallData[]
  apiResult?: ApiResultData
}
