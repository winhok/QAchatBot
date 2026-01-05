import { type ChatMessageState, initialMessageState } from './slices/message'

/**
 * Chat Store 聚合状态类型
 */
export type ChatStoreState = ChatMessageState

/**
 * Chat Store 初始状态
 */
export const initialState: ChatStoreState = {
  ...initialMessageState,
}
