/**
 * QA Chatbot Agent 图编译
 */
import { END, START, StateGraph } from '@langchain/langgraph'
import type { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import type { ChatOpenAI } from '@langchain/openai'
import { routeAfterRouter, ROUTE_TARGETS } from './edges'
import {
  createRouterNode,
  createGenTestPointsNode,
  createGenTestCasesNode,
  createGenReviewNode,
  createHandleCompletedReviseNode,
  createHandleOtherNode,
} from './nodes'
import { QAChatbotState } from './state'

/**
 * 编译 QA Chatbot 工作流
 */
export function compileQAChatbotGraph(model: ChatOpenAI, checkpointer: PostgresSaver) {
  const workflow = new StateGraph(QAChatbotState)
    // 添加节点
    .addNode('router', createRouterNode())
    .addNode('gen_test_points', createGenTestPointsNode(model))
    .addNode('gen_test_cases', createGenTestCasesNode(model))
    .addNode('gen_review', createGenReviewNode(model))
    .addNode('handle_revise', createHandleCompletedReviseNode(model))
    .addNode('handle_other', createHandleOtherNode(model))

    // 入口边
    .addEdge(START, 'router')

    // Router 条件边
    .addConditionalEdges('router', routeAfterRouter, ROUTE_TARGETS)

    // 所有生成节点 -> END
    .addEdge('gen_test_points', END)
    .addEdge('gen_test_cases', END)
    .addEdge('gen_review', END)
    .addEdge('handle_revise', END)
    .addEdge('handle_other', END)

  return workflow.compile({ checkpointer })
}

/**
 * 获取图的可视化 Mermaid 图
 */
export function getGraphMermaid(): string {
  return `
graph TD
    START((Start)) --> router[Router]
    router -->|init| gen_test_points[Gen Test Points]
    router -->|test_points + continue| gen_test_cases[Gen Test Cases]
    router -->|test_points + revise| gen_test_points
    router -->|test_cases + continue| gen_review[Gen Review]
    router -->|test_cases + revise| gen_test_cases
    router -->|completed + revise| handle_revise[Handle Revise]
    router -->|other| handle_other[Handle Other]
    gen_test_points --> END((End))
    gen_test_cases --> END
    gen_review --> END
    handle_revise --> END
    handle_other --> END
`
}
