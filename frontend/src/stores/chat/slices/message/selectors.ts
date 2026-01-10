import type { Message } from '@/schemas'
import type { ChatStoreState } from '../../initialState'

/**
 * 消息选择器
 * 用于从 store 中派生状态
 */
export const messageSelectors = {
  /**
   * 是否有消息正在流式输出
   */
  isAnyStreaming: (state: ChatStoreState) => state.messages.some((msg) => msg.isStreaming),

  /**
   * 获取最后一条 AI 消息
   */
  lastAssistantMessage: (state: ChatStoreState): Message | undefined =>
    [...state.messages].reverse().find((m) => m.role === 'assistant'),

  /**
   * 获取最后一条用户消息
   */
  lastUserMessage: (state: ChatStoreState): Message | undefined =>
    [...state.messages].reverse().find((m) => m.role === 'user'),

  /**
   * 根据 ID 获取消息
   */
  getMessageById:
    (id: string) =>
    (state: ChatStoreState): Message | undefined =>
      state.messages.find((m) => m.id === id),

  /**
   * 获取所有 AI 消息
   */
  assistantMessages: (state: ChatStoreState): Array<Message> =>
    state.messages.filter((m) => m.role === 'assistant'),

  /**
   * 获取所有用户消息
   */
  userMessages: (state: ChatStoreState): Array<Message> =>
    state.messages.filter((m) => m.role === 'user'),

  /**
   * 消息总数
   */
  messageCount: (state: ChatStoreState): number => state.messages.length,

  /**
   * 是否有消息
   */
  hasMessages: (state: ChatStoreState): boolean => state.messages.length > 0,
}
