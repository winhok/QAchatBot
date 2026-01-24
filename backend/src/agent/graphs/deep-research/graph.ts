import type { RunnableConfig } from '@langchain/core/runnables'
import { END, START, StateGraph, type BaseCheckpointSaver } from '@langchain/langgraph'
import {
  analyzeQuestionNode,
  coordinateResearchNode,
  generateCanvasNode,
  generatePlanNode,
  humanApprovalNode,
} from './nodes'
import { DeepResearchStateAnnotation, type DeepResearchState } from './state'

type NodeFunction = (
  state: DeepResearchState,
  config?: RunnableConfig,
) => Promise<Partial<DeepResearchState>> | Partial<DeepResearchState>

/**
 * 包装节点函数，添加日志输出
 */
function withLogging(nodeName: string, nodeFunc: NodeFunction): NodeFunction {
  return async (state: DeepResearchState, config?: RunnableConfig) => {
    console.log(`\n========== [${nodeName}] INPUT ==========`)
    console.log(
      JSON.stringify(
        {
          question: state.question,
          status: state.status,
          progress: state.progress,
          analysisExists: !!state.analysis,
          planExists: !!state.plan,
          generatedContentCount: state.generatedContent?.length ?? 0,
          approvalStatus: state.approvalStatus,
          userFeedback: state.userFeedback,
          error: state.error,
        },
        null,
        2,
      ),
    )

    const result = await nodeFunc(state, config)

    console.log(`\n========== [${nodeName}] OUTPUT ==========`)
    console.log(
      JSON.stringify(
        {
          status: result.status,
          progress: result.progress,
          analysisExists: !!result.analysis,
          planExists: !!result.plan,
          generatedContentCount: result.generatedContent?.length,
          approvalStatus: result.approvalStatus,
          userFeedback: result.userFeedback,
          error: result.error,
          finalArtifactExists: !!result.finalArtifact,
        },
        null,
        2,
      ),
    )
    console.log(`========== [${nodeName}] END ==========\n`)

    return result
  }
}

/**
 * 创建 Deep Research 工作流图
 *
 * 工作流结构：
 * START → analyze_question → generate_plan → human_approval
 *                                                  ↓
 *                              ← (rejected) ←─────┤
 *                                                  ↓ (approved)
 *                                      coordinate_research → generate_canvas → END
 */
export function createDeepResearchGraph(checkpointer?: BaseCheckpointSaver<number>) {
  const workflow = new StateGraph(DeepResearchStateAnnotation)
    .addNode('analyze_question', withLogging('analyze_question', analyzeQuestionNode))
    .addNode('generate_plan', withLogging('generate_plan', generatePlanNode))
    .addNode('human_approval', humanApprovalNode, {
      ends: ['generate_plan', 'coordinate_research'],
    })
    .addNode('coordinate_research', withLogging('coordinate_research', coordinateResearchNode))
    .addNode('generate_canvas', withLogging('generate_canvas', generateCanvasNode))
    // 边定义
    .addEdge(START, 'analyze_question')
    .addEdge('analyze_question', 'generate_plan')
    .addEdge('generate_plan', 'human_approval')
    .addEdge('coordinate_research', 'generate_canvas')
    .addEdge('generate_canvas', END)

  return workflow.compile({ checkpointer })
}

/**
 * 创建初始状态
 */
export function createInitialState(question: string): Partial<DeepResearchState> {
  return {
    question,
    generatedContent: [],
    status: 'analyzing',
    progress: 0,
    messages: [],
  }
}

/**
 * 验证状态有效性
 */
export function validateState(state: Partial<DeepResearchState>): boolean {
  return !!(state.question && state.status && typeof state.progress === 'number')
}
