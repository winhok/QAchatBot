import type { BaseMessage } from '@langchain/core/messages'

/**
 * Agent 接口定义
 */
export interface IAgent {
  /**
   * 获取编译后的 LangGraph 应用
   */
  getApp(modelId?: string): unknown

  /**
   * 获取聊天历史
   */
  getHistory(threadId: string, modelId?: string): Promise<BaseMessage[]>
}

/**
 * Agent 配置接口
 */
export interface AgentConfig {
  modelId: string
  temperature?: number
  streaming?: boolean
  timeout?: number
}

/**
 * Agent 运行配置
 */
export interface AgentRunConfig {
  threadId: string
  modelId?: string
}
