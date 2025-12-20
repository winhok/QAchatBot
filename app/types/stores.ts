import type { Message, ToolCallData, ChatMessageContent } from '@/app/schemas'

// 从 Zod schemas 推断的类型
export type { SessionType, Session } from '@/app/schemas'

// Store 状态类型 (包含方法，不适合用 Zod 定义)
export interface ChatMessagesState {
  messages: Message[]
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
  resetMessages: () => void
  loadMessages: (historyMessages: Message[]) => void
  addToolCall: (messageId: string, toolCall: ToolCallData) => void
  updateToolCallStatus: (messageId: string, toolCallId: string, status: ToolCallData['status'], output?: unknown, duration?: number) => void
}

export interface SendMessageOptions {
  sessionId?: string
  onSessionCreated?: () => void
}

export interface SendMessageState {
  sendMessage: (input: ChatMessageContent, options?: SendMessageOptions) => Promise<void>
  abortCurrent: () => void
  currentAbortController: AbortController | null
}

export interface SessionState {
  sessionId: string
  sessionType: import('@/app/schemas').SessionType
  modelId: string
  hasUserMessage: boolean
  welcomeRefreshTrigger: number
  renameId: string | null
  renameValue: string
  setSessionId: (id: string) => void
  setSessionType: (type: import('@/app/schemas').SessionType) => void
  setModelId: (modelId: string) => void
  refreshWelcome: () => void
  createNewSession: (id: string, type?: import('@/app/schemas').SessionType) => void
  updateSessionName: (name: string) => Promise<void>
  resetHasUserMessage: () => void
  setRenameId: (id: string | null) => void
  setRenameValue: (value: string) => void
  openRenameModal: (id: string, name: string) => void
  closeRenameModal: () => void
}
