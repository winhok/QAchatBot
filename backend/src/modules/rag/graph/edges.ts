import { RagStateType } from './state'
import { RetrievalDecision } from './types'

/**
 * 条件边：决定是重新检索还是生成答案
 */
export function shouldRetrieve(state: RagStateType): RetrievalDecision {
  const { needsReretrieval, retrievalRound = 1 } = state

  // 最多重试 3 轮
  if (needsReretrieval && retrievalRound < 3) {
    return 'incrementRound'
  }

  return 'generateAnswer'
}
