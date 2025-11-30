import { create } from 'zustand'
import type { Message } from '../types/messages'
import type { ChatMessagesState } from '../types/stores'

const INITIAL_MESSAGE: Message = {
  id: '1',
  content:
    'Hello! I am an AI assistant powered by LangGraphJS.✨ I can help you answer questions, provide advice, or engage in interesting conversations. What can I help you with?',
  role: 'assistant',
  timestamp: new Date(),
}

export const useChatMessages = create<ChatMessagesState>(set => ({
  messages: [INITIAL_MESSAGE],
  isLoading: false,

  setIsLoading: loading => set({ isLoading: loading }),

  addUserMessage: content => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }
    set(state => ({ messages: [...state.messages, userMessage] }))
    return userMessage
  },

  addAssistantMessage: () => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    }
    set(state => ({ messages: [...state.messages, assistantMessage] }))
    return assistantMessage
  },

  updateMessageContent: (messageId, content) => {
    set(state => ({
      messages: state.messages.map(msg => (msg.id === messageId ? { ...msg, content: msg.content + content } : msg)),
    }))
  },

  finishStreaming: messageId => {
    set(state => ({
      messages: state.messages.map(msg => (msg.id === messageId ? { ...msg, isStreaming: false } : msg)),
    }))
  },

  addErrorMessage: () => {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Sorry, Something went wrong. Please try again later.',
      role: 'assistant',
      timestamp: new Date(),
    }
    set(state => ({ messages: [...state.messages, errorMessage] }))
  },

  resetMessages: () => set({ messages: [INITIAL_MESSAGE] }),

  loadMessages: historyMessages => {
    set({ messages: historyMessages.length > 0 ? historyMessages : [INITIAL_MESSAGE] })
  },
}))
