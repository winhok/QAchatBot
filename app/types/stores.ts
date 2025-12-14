import type { Message, ToolCallData } from './messages'

export type SessionType = 'normal' | 'testcase'

export interface Session {
  id: string
  name: string
  type: SessionType
  created_at: string
}

export interface ChatMessagesState {
  messages: Message[]
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  addUserMessage: (content: string) => Message
  addAssistantMessage: () => Message
  updateMessageContent: (messageId: string, content: string) => void
  finishStreaming: (messageId: string) => void
  addErrorMessage: () => void
  resetMessages: () => void
  loadMessages: (historyMessages: Message[]) => void
  addToolCall: (messageId: string, toolCall: ToolCallData) => void
  updateToolCallStatus: (messageId: string, toolCallId: string, status: ToolCallData['status'], output?: unknown, duration?: number) => void
}

export interface SendMessageParams {
  sessionId: string
  sessionType: SessionType
  addUserMessage: (content: string) => void
  addAssistantMessage: () => { id: string }
  updateMessageContent: (messageId: string, content: string) => void
  finishStreaming: (messageId: string) => void
  addErrorMessage: () => void
  setIsLoading: (loading: boolean) => void
  updateSessionName: (name: string) => void
  addToolCall: (messageId: string, toolCall: ToolCallData) => void
  updateToolCallStatus: (messageId: string, toolCallId: string, status: ToolCallData['status'], output?: unknown, duration?: number) => void
  onSessionCreated?: () => void
}

export interface SendMessageState {
  sendMessage: (input: string, params: SendMessageParams) => Promise<void>
}

export interface SessionState {
  sessionId: string
  sessionType: SessionType
  hasUserMessage: boolean
  renameId: string | null
  renameValue: string
  setSessionId: (id: string) => void
  setSessionType: (type: SessionType) => void
  createNewSession: (id: string, type?: SessionType) => void
  updateSessionName: (name: string) => Promise<void>
  resetHasUserMessage: () => void
  setRenameId: (id: string | null) => void
  setRenameValue: (value: string) => void
  openRenameModal: (id: string, name: string) => void
  closeRenameModal: () => void
}
