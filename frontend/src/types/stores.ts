import type { ChatMessageContent, Message, Session, ToolCallData } from '@/schemas'

// 重新导出类型
export type { Session }

// Store 状态类型 (包含方法，不适合用 Zod 定义)
export interface ChatMessagesState {
  messages: Array<Message>
  isLoading: boolean
  draftMessage: string
  setIsLoading: (loading: boolean) => void
  setDraftMessage: (message: string) => void
  clearDraftMessage: () => void
  addUserMessage: (content: ChatMessageContent) => Message
  addAssistantMessage: () => Message
  updateMessageContent: (messageId: string, content: string) => void
  finishStreaming: (messageId: string) => void
  addErrorMessage: () => void
  clearMessages: () => void
  loadMessages: (historyMessages: Array<Message>) => void
  addToolCall: (messageId: string, toolCall: ToolCallData) => void
  updateToolCallStatus: (
    messageId: string,
    toolCallId: string,
    status: ToolCallData['status'],
    output?: unknown,
    duration?: number,
  ) => void
}

export interface SendMessageOptions {
  sessionId?: string
  onSessionCreated?: () => void
  checkpointId?: string // 从指定 checkpoint 分叉 (LangGraph Time Travel)
  deepResearch?: boolean
}

export interface SessionState {
  sessionId: string
  modelId: string
  hasUserMessage: boolean
  welcomeRefreshTrigger: number
  renameId: string | null
  renameValue: string
  setSessionId: (id: string) => void
  setModelId: (modelId: string) => void
  refreshWelcome: () => void
  createNewSession: (id: string) => void
  setHasUserMessage: (has: boolean) => void
  resetHasUserMessage: () => void
  setRenameId: (id: string | null) => void
  setRenameValue: (value: string) => void
  openRenameModal: (id: string, name: string) => void
  closeRenameModal: () => void
}
