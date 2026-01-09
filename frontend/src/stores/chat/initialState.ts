import { type ChatMessageState, initialMessageState } from './slices/message'
import { type StreamState, initialStreamState } from './slices/stream'

/**
 * Chat Store 聚合状态类型
 */
export type ChatStoreState = ChatMessageState & StreamState

/**
 * Chat Store 初始状态
 */
export const initialState: ChatStoreState = {
  ...initialMessageState,
  ...initialStreamState,
}
