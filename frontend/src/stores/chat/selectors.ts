import { messageSelectors } from './slices/message'
import { toolCallSelectors } from './slices/toolCall'

/**
 * Chat Store 选择器聚合
 */
export const chatSelectors = {
  ...messageSelectors,
  ...toolCallSelectors,
}

export { messageSelectors } from './slices/message'
export { toolCallSelectors } from './slices/toolCall'

