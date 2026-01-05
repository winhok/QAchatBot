import type { ChatMessageContent, Message, ToolCallData } from '@/schemas'
import type { ChatMessagesState } from '@/types/stores'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

export const useChatMessages = create<ChatMessagesState>()(
  devtools(
    subscribeWithSelector((set: any) => ({
      messages: [] as Message[],
      isLoading: false as boolean,
      draftMessage: '',

      setIsLoading: (loading: boolean) => set({ isLoading: loading }, false, 'setIsLoading'),

      setDraftMessage: (message: string) => set({ draftMessage: message }, false, 'setDraftMessage'),

      clearDraftMessage: () => set({ draftMessage: '' }, false, 'clearDraftMessage'),

      addUserMessage: (content: ChatMessageContent) => {
        const userMessage: Message = {
          id: Date.now().toString(),
          content,
          role: 'user',
          timestamp: new Date(),
        }
        set(
          (state: ChatMessagesState) => ({ messages: [...state.messages, userMessage] }),
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
          (state: ChatMessagesState) => ({ messages: [...state.messages, assistantMessage] }),
          false,
          'addAssistantMessage',
        )
        return assistantMessage
      },

      updateMessageContent: (messageId: string, content: string) => {
        set(
          (state: ChatMessagesState) => ({
            messages: state.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content: msg.content + content } : msg,
            ),
          }),
          false,
          'updateMessageContent',
        )
      },

      finishStreaming: (messageId: string) => {
        set(
          (state: ChatMessagesState) => ({
            messages: state.messages.map((msg) =>
              msg.id === messageId ? { ...msg, isStreaming: false } : msg,
            ),
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
          (state: ChatMessagesState) => ({ messages: [...state.messages, errorMessage] }),
          false,
          'addErrorMessage',
        )
      },

      clearMessages: () => set({ messages: [] as Message[] }, false, 'clearMessages'),

      loadMessages: (historyMessages: Message[]) => {
        set({ messages: historyMessages }, false, 'loadMessages')
      },

      addToolCall: (messageId: string, toolCall: ToolCallData) => {
        set(
          (state: ChatMessagesState) => ({
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

      updateToolCallStatus: (
        messageId: string,
        toolCallId: string,
        status: ToolCallData['status'],
        output?: unknown,
        duration?: number,
      ) => {
        set(
          (state: ChatMessagesState) => ({
            messages: state.messages.map((msg) => {
              if (msg.id === messageId && msg.toolCalls) {
                return {
                  ...msg,
                  toolCalls: msg.toolCalls.map((tc: ToolCallData) =>
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
          }),
          false,
          'updateToolCallStatus',
        )
      },
    })),
    { name: 'ChatMessagesStore' },
  ),
)
