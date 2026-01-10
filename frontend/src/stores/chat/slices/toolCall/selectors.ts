import type { ToolCallData } from '@/schemas'
import type { ChatStoreState } from '../../initialState'

/**
 * 工具调用选择器
 */
export const toolCallSelectors = {
  /**
   * 获取所有正在运行的工具调用
   */
  pendingToolCalls: (state: ChatStoreState): Array<ToolCallData> =>
    state.messages.flatMap((m) => m.toolCalls?.filter((tc) => tc.status === 'running') || []),

  /**
   * 获取指定消息的所有工具调用
   */
  getToolCallsByMessageId:
    (messageId: string) =>
    (state: ChatStoreState): Array<ToolCallData> =>
      state.messages.find((m) => m.id === messageId)?.toolCalls || [],

  /**
   * 是否有工具正在运行
   */
  hasRunningToolCalls: (state: ChatStoreState): boolean =>
    state.messages.some((m) => m.toolCalls?.some((tc) => tc.status === 'running')),

  /**
   * 获取工具调用总数
   */
  totalToolCallCount: (state: ChatStoreState): number =>
    state.messages.reduce((acc, m) => acc + (m.toolCalls?.length || 0), 0),

  /**
   * 根据 ID 获取工具调用
   */
  getToolCallById:
    (toolCallId: string) =>
    (state: ChatStoreState): ToolCallData | undefined => {
      for (const msg of state.messages) {
        const toolCall = msg.toolCalls?.find((tc) => tc.id === toolCallId)
        if (toolCall) return toolCall
      }
      return undefined
    },
}
