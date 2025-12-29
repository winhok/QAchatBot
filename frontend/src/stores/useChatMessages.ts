import { create } from 'zustand'
import type { ChatMessageContent, Message } from '@/schemas'
import type { ChatMessagesState } from '@/types/stores'

export const useChatMessages = create<ChatMessagesState>((set) => ({
  messages: [],
  isLoading: false,
  draftMessage: '',

  setIsLoading: (loading) => set({ isLoading: loading }),

  setDraftMessage: (message) => set({ draftMessage: message }),

  clearDraftMessage: () => set({ draftMessage: '' }),

  addUserMessage: (content: ChatMessageContent) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }
    set((state) => ({ messages: [...state.messages, userMessage] }))
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
    set((state) => ({ messages: [...state.messages, assistantMessage] }))
    return assistantMessage
  },

  updateMessageContent: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content: msg.content + content } : msg,
      ),
    }))
  },

  finishStreaming: (messageId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming: false } : msg,
      ),
    }))
  },

  addErrorMessage: () => {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Sorry, Something went wrong. Please try again later.',
      role: 'assistant',
      timestamp: new Date(),
    }
    set((state) => ({ messages: [...state.messages, errorMessage] }))
  },

  clearMessages: () => set({ messages: [] }),

  loadMessages: (historyMessages) => {
    set({ messages: historyMessages })
  },

  addToolCall: (messageId, toolCall) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          const existingToolCalls = msg.toolCalls || []
          return { ...msg, toolCalls: [...existingToolCalls, toolCall] }
        }
        return msg
      }),
    }))
  },

  updateToolCallStatus: (messageId, toolCallId, status, output, duration) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId && msg.toolCalls) {
          return {
            ...msg,
            toolCalls: msg.toolCalls.map((tc) =>
              tc.id === toolCallId
                ? {
                    ...tc,
                    status,
                    output:
                      output !== undefined
                        ? (output as Record<string, unknown>)
                        : tc.output,
                    duration: duration !== undefined ? duration : tc.duration,
                  }
                : tc,
            ),
          }
        }
        return msg
      }),
    }))
  },
}))
