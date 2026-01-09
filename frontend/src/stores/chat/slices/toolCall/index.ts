import type { ToolCallData } from '@/schemas'
import type { StateCreator } from 'zustand'
import type { ChatStore } from '../../store'

/**
 * ToolCall slice actions 接口
 */
export interface ToolCallAction {
  addToolCall: (messageId: string, toolCall: ToolCallData) => void
  updateToolCallStatus: (
    messageId: string,
    toolCallId: string,
    status: ToolCallData['status'],
    output?: unknown,
    duration?: number,
  ) => void
  clearToolCalls: (messageId: string) => void
}

/**
 * ToolCall slice 实现
 */
export const toolCallSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ToolCallAction
> = (set) => ({
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
      'toolCall/addToolCall',
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
                      output:
                        output !== undefined ? (output as Record<string, unknown>) : tc.output,
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
      'toolCall/updateToolCallStatus',
    )
  },

  clearToolCalls: (messageId) => {
    set(
      (state) => ({
        messages: state.messages.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, toolCalls: [] }
          }
          return msg
        }),
      }),
      false,
      'toolCall/clearToolCalls',
    )
  },
})

export { toolCallSelectors } from './selectors'
