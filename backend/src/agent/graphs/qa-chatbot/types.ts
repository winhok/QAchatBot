/**
 * QA Chatbot Agent 类型定义
 */

/**
 * 工作流阶段
 */
export type QAWorkflowStage = 'init' | 'test_points' | 'test_cases' | 'review' | 'completed'

/**
 * 用户意图
 */
export type UserIntent = 'continue' | 'revise' | 'other'

/**
 * 节点名称
 */
export type QANodeName =
  | 'router'
  | 'gen_test_points'
  | 'gen_test_cases'
  | 'gen_review'
  | 'handle_revise'
  | 'handle_other'

/**
 * 路由目标
 */
export type RouteTarget = QANodeName | '__end__'
