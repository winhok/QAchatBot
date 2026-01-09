/**
 * QA Chatbot Agent 路由逻辑
 */
import { END } from '@langchain/langgraph'
import type { QAChatbotStateType } from './state'
import type { RouteTarget } from './types'

/**
 * Router 节点后的条件路由
 *
 * 根据当前阶段和用户意图决定下一个节点
 */
export function routeAfterRouter(state: QAChatbotStateType): RouteTarget {
  const { stage, userIntent } = state

  console.log('[QA Route] stage:', stage, 'intent:', userIntent)

  // 初始阶段 -> 生成测试点
  if (stage === 'init') {
    return 'gen_test_points'
  }

  // 测试点阶段
  if (stage === 'test_points') {
    if (userIntent === 'continue') {
      return 'gen_test_cases'
    }
    if (userIntent === 'revise') {
      return 'gen_test_points' // 重新生成测试点
    }
    return 'handle_other'
  }

  // 测试用例阶段
  if (stage === 'test_cases') {
    if (userIntent === 'continue') {
      return 'gen_review'
    }
    if (userIntent === 'revise') {
      return 'gen_test_cases' // 重新生成测试用例
    }
    return 'handle_other'
  }

  // 已完成阶段
  if (stage === 'completed') {
    if (userIntent === 'revise') {
      return 'handle_revise'
    }
    return 'handle_other'
  }

  // 默认
  return 'handle_other'
}

/**
 * 所有可能的路由目标（用于 addConditionalEdges）
 */
export const ROUTE_TARGETS: RouteTarget[] = [
  'gen_test_points',
  'gen_test_cases',
  'gen_review',
  'handle_revise',
  'handle_other',
]

/**
 * 生成节点后全部返回 END
 */
export function routeToEnd(): typeof END {
  return END
}
