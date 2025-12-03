import type { Message } from './messages'

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
}

export interface SendMessageParams {
  sessionId: string
  addUserMessage: (content: string) => void
  addAssistantMessage: () => { id: string }
  updateMessageContent: (messageId: string, content: string) => void
  finishStreaming: (messageId: string) => void
  addErrorMessage: () => void
  setIsLoading: (loading: boolean) => void
  updateSessionName: (name: string) => void
}

export interface SendMessageState {
  sendMessage: (input: string, params: SendMessageParams) => Promise<void>
}

export interface SessionState {
  sessionId: string
  hasUserMessage: boolean
  renameId: string | null
  renameValue: string
  setSessionId: (id: string) => void
  createNewSession: (id: string) => void
  updateSessionName: (name: string) => Promise<void>
  resetHasUserMessage: () => void
  setRenameId: (id: string | null) => void
  setRenameValue: (value: string) => void
  openRenameModal: (id: string, name: string) => void
  closeRenameModal: () => void
}
