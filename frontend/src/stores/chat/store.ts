import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { StateCreator } from 'zustand/vanilla'

import { type ChatStoreState, initialState } from './initialState'
import { type MessageAction, messageSlice } from './slices/message'
import { type StreamAction, streamSlice } from './slices/stream'
import { type ToolCallAction, toolCallSlice } from './slices/toolCall'

/**
 * Chat Store Action 类型
 */
export interface ChatStoreAction extends MessageAction, StreamAction, ToolCallAction {}

/**
 * Chat Store 完整类型
 */
export type ChatStore = ChatStoreAction & ChatStoreState

/**
 * 检查是否启用 DevTools
 */
const isDevtoolsEnabled = () => {
  if (typeof window === 'undefined') return false
  const url = new URL(window.location.href)
  return url.searchParams.get('debug')?.includes('chat') ?? false
}

/**
 * 创建 Store
 * - messageSlice: 消息 CRUD 操作
 * - streamSlice: 流状态管理
 * - toolCallSlice: 工具调用操作
 */
const createStore: StateCreator<ChatStore, [['zustand/devtools', never]]> = (...params) => ({
  ...initialState,
  ...messageSlice(...params),
  ...streamSlice(...params),
  ...toolCallSlice(...params),
})

/**
 * Chat Store 实例
 */
export const useChatStore = createWithEqualityFn<ChatStore>()(
  subscribeWithSelector(
    devtools(createStore, {
      name: 'QABot_chat',
      enabled: isDevtoolsEnabled(),
    }),
  ),
  shallow,
)

/**
 * 获取 store 状态（用于在 hooks 外部访问）
 */
export const getChatStoreState = () => useChatStore.getState()
