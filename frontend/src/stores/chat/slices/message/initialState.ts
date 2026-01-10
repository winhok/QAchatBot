import type { Message } from '@/schemas'

/**
 * Message slice 初始状态
 * 仅包含消息相关状态，流状态由 stream slice 管理
 */
export interface ChatMessageState {
  messages: Array<Message>
  draftMessage: string
}

export const initialMessageState: ChatMessageState = {
  messages: [],
  draftMessage: '',
}
