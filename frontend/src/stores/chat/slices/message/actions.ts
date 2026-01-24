import { messagesReducer } from './reducer'
import type { ChatMessageContent, Message } from '@/schemas'
import type { StateCreator } from 'zustand'
import type { ChatStore } from '../../store'

/**
 * Message slice actions 接口
 * 仅处理消息相关操作，工具调用由 toolCall slice 处理，流状态由 stream slice 处理
 */
export interface MessageAction {
  // 消息操作
  addUserMessage: (content: ChatMessageContent) => Message
  addAssistantMessage: () => Message
  updateMessageContent: (messageId: string, content: string) => void
  finishStreaming: (messageId: string, checkpointId?: string) => void
  addErrorMessage: () => void
  clearMessages: () => void
  loadMessages: (historyMessages: Array<Message>) => void

  // 草稿消息
  setDraftMessage: (message: string) => void
  clearDraftMessage: () => void
}

/**
 * Message slice 实现
 */
export const messageSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  MessageAction
> = (set) => ({
  setDraftMessage: (message) => {
    set({ draftMessage: message }, false, 'message/setDraftMessage')
  },

  clearDraftMessage: () => {
    set({ draftMessage: '' }, false, 'message/clearDraftMessage')
  },

  addUserMessage: (content) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'addMessage', payload: userMessage }),
      }),
      false,
      'message/addUserMessage',
    )
    return userMessage
  },

  addAssistantMessage: () => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
      toolCalls: [],
    }
    set(
      (state) => ({
        messages: messagesReducer(state.messages, {
          type: 'addMessage',
          payload: assistantMessage,
        }),
      }),
      false,
      'message/addAssistantMessage',
    )
    return assistantMessage
  },

  updateMessageContent: (messageId, content) => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, {
          type: 'updateMessageContent',
          id: messageId,
          content,
        }),
      }),
      false,
      'message/updateMessageContent',
    )
  },

  finishStreaming: (messageId, checkpointId) => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, {
          type: 'finishStreaming',
          id: messageId,
          checkpointId,
        }),
      }),
      false,
      'message/finishStreaming',
    )
  },

  addErrorMessage: () => {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Sorry, Something went wrong. Please try again later.',
      role: 'assistant',
      timestamp: new Date(),
    }
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'addMessage', payload: errorMessage }),
      }),
      false,
      'message/addErrorMessage',
    )
  },

  clearMessages: () => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'clearMessages' }),
      }),
      false,
      'message/clearMessages',
    )
  },

  loadMessages: (historyMessages) => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, {
          type: 'loadMessages',
          messages: historyMessages,
        }),
      }),
      false,
      'message/loadMessages',
    )
  },
})
