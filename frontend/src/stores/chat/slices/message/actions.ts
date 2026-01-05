import type { ChatMessageContent, Message, ToolCallData } from '@/schemas'
import type { StateCreator } from 'zustand'
import type { ChatStore } from '../../store'
import { messagesReducer } from './reducer'

/**
 * Message slice actions 接口
 */
export interface MessageAction {
  // 消息操作
  addUserMessage: (content: ChatMessageContent) => Message
  addAssistantMessage: () => Message
  updateMessageContent: (messageId: string, content: string) => void
  finishStreaming: (messageId: string) => void
  addErrorMessage: () => void
  clearMessages: () => void
  loadMessages: (historyMessages: Message[]) => void

  // 草稿消息
  setDraftMessage: (message: string) => void
  clearDraftMessage: () => void

  // 加载状态
  setIsLoading: (loading: boolean) => void

  // 工具调用
  addToolCall: (messageId: string, toolCall: ToolCallData) => void
  updateToolCallStatus: (
    messageId: string,
    toolCallId: string,
    status: ToolCallData['status'],
    output?: unknown,
    duration?: number,
  ) => void
}

/**
 * Message slice 实现
 */
export const messageSlice: StateCreator<ChatStore, [['zustand/devtools', never]], [], MessageAction> = (
  set,
) => ({
  setIsLoading: (loading) => {
    set({ isLoading: loading }, false, 'setIsLoading')
  },

  setDraftMessage: (message) => {
    set({ draftMessage: message }, false, 'setDraftMessage')
  },

  clearDraftMessage: () => {
    set({ draftMessage: '' }, false, 'clearDraftMessage')
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
      'addUserMessage',
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
        messages: messagesReducer(state.messages, { type: 'addMessage', payload: assistantMessage }),
      }),
      false,
      'addAssistantMessage',
    )
    return assistantMessage
  },

  updateMessageContent: (messageId, content) => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'updateMessageContent', id: messageId, content }),
      }),
      false,
      'updateMessageContent',
    )
  },

  finishStreaming: (messageId) => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'finishStreaming', id: messageId }),
      }),
      false,
      'finishStreaming',
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
      'addErrorMessage',
    )
  },

  clearMessages: () => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'clearMessages' }),
      }),
      false,
      'clearMessages',
    )
  },

  loadMessages: (historyMessages) => {
    set(
      (state) => ({
        messages: messagesReducer(state.messages, { type: 'loadMessages', messages: historyMessages }),
      }),
      false,
      'loadMessages',
    )
  },

  addToolCall: (messageId, toolCall) => {
    set(
      (state) => ({
        messages: state.messages.map((msg) => {
          if (msg.id === messageId) {
            const existingToolCalls = msg.toolCalls || []
            return { ...msg, toolCalls: [...existingToolCalls, toolCall] }
          }
          return msg
        }),
      }),
      false,
      'addToolCall',
    )
  },

  updateToolCallStatus: (messageId, toolCallId, status, output, duration) => {
    set(
      (state) => ({
        messages: state.messages.map((msg) => {
          if (msg.id === messageId && msg.toolCalls) {
            return {
              ...msg,
              toolCalls: msg.toolCalls.map((tc: ToolCallData) =>
                tc.id === toolCallId
                  ? {
                      ...tc,
                      status,
                      output: output !== undefined ? (output as Record<string, unknown>) : tc.output,
                      duration: duration !== undefined ? duration : tc.duration,
                    }
                  : tc,
              ),
            }
          }
          return msg
        }),
      }),
      false,
      'updateToolCallStatus',
    )
  },
})
