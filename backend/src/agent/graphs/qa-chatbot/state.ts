/**
 * QA Chatbot Agent 状态定义
 */
import { BaseMessage } from '@langchain/core/messages'
import { Annotation } from '@langchain/langgraph'
import type { QAWorkflowStage, UserIntent } from './types'

/**
 * QA Chatbot 状态 Annotation
 */
export const QAChatbotState = Annotation.Root({
  // 消息历史
  messages: Annotation<BaseMessage[]>({
    reducer: (existing, newMessages) => [...existing, ...newMessages],
    default: () => [],
  }),

  // 当前工作流阶段
  stage: Annotation<QAWorkflowStage>({
    reducer: (_, newValue) => newValue,
    default: () => 'init',
  }),

  // 用户意图（由 router 节点设置）
  userIntent: Annotation<UserIntent>({
    reducer: (_, newValue) => newValue,
    default: () => 'other',
  }),

  // PRD 原始内容
  prdContent: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),

  // 生成的测试点
  testPoints: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),

  // 生成的测试用例
  testCases: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
})

/**
 * 状态类型
 */
export type QAChatbotStateType = typeof QAChatbotState.State
