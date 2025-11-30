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
  updateMessageContent: (id: string, content: string) => void
  finishStreaming: (id: string) => void
  addErrorMessage: () => void
  setIsLoading: (loading: boolean) => void
  updateSessionName: (name: string) => void
}

export interface ChatStore {
  sendMessage: (input: string, params: SendMessageParams) => Promise<void>
}
