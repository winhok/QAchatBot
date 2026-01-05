import type { Message } from '@/schemas'

/**
 * Message slice 初始状态
 */
export interface ChatMessageState {
  messages: Message[]
  isLoading: boolean
  draftMessage: string
}

export const initialMessageState: ChatMessageState = {
  messages: [],
  isLoading: false,
  draftMessage: '',
}
