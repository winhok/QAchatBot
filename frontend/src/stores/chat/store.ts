import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

import { initialState } from './initialState'
import { messageSlice } from './slices/message'
import { streamSlice } from './slices/stream'
import { toolCallSlice } from './slices/toolCall'
import type { StateCreator } from 'zustand/vanilla'
import type { ChatStoreState } from './initialState'
import type { MessageAction } from './slices/message'
import type { StreamAction } from './slices/stream'
import type { ToolCallAction } from './slices/toolCall'

/**
 * Chat Store Action 类型
 */
export interface ChatStoreAction extends MessageAction, StreamAction, ToolCallAction {}

/**
 * Chat Store 完整类型
 */
export type ChatStore = ChatStoreAction & ChatStoreState

/**
 * 检查是否启用 DevTools (IIFE - runs once at module load)
 */
const isDevtoolsEnabled = (() => {
  if (typeof window === 'undefined') return false
  return new URL(window.location.href).searchParams.get('debug')?.includes('chat') ?? false
})()

/**
 * 创建 Store
 * - messageSlice: 消息 CRUD 操作
 * - streamSlice: 流状态管理
 * - toolCallSlice: 工具调用操作
 * - immer: 启用直接修改语法的不可变更新
 */
const createStore: StateCreator<
  ChatStore,
  [['zustand/devtools', never], ['zustand/immer', never]]
> = (...params) => ({
  ...initialState,
  ...messageSlice(...params),
  ...streamSlice(...params),
  ...toolCallSlice(...params),
})

/**
 * Chat Store 实例
 * Middleware 顺序: immer -> devtools -> subscribeWithSelector
 */
export const useChatStore = createWithEqualityFn<ChatStore>()(
  subscribeWithSelector(
    devtools(immer(createStore), {
      name: 'QABot_chat',
      enabled: isDevtoolsEnabled,
    }),
  ),
  shallow,
)

/**
 * 获取 store 状态（用于在 hooks 外部访问）
 */
export const getChatStoreState = () => useChatStore.getState()
