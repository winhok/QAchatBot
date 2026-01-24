import { BaseMessage } from '@langchain/core/messages'
import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'
import type {
  ContentSection,
  PlanApprovalStatus,
  QuestionAnalysis,
  ResearchPlan,
  ResearchStatus,
} from './types'

/**
 * 研究计划 Schema（用于结构化输出）
 */
export const planSchema = z.object({
  title: z.string().describe('研究标题'),
  description: z.string().describe('研究描述'),
  objectives: z.array(z.string().describe('研究目标')).describe('目标列表'),
  methodology: z.array(z.string().describe('研究方法')).describe('方法列表'),
  expectedOutcome: z.string().describe('预期成果'),
  sections: z
    .array(
      z.object({
        title: z.string().describe('章节标题'),
        description: z.string().describe('章节描述'),
        priority: z.number().describe('章节优先级'),
      }),
    )
    .min(3)
    .describe('章节列表，至少3个'),
})

/**
 * Deep Research 状态注解
 *
 * 使用 LangGraph Annotation 定义工作流状态，支持：
 * - 消息历史累积
 * - 章节内容合并
 * - 进度追踪
 */
export const DeepResearchStateAnnotation = Annotation.Root({
  // 原始研究问题
  question: Annotation<string>(),

  // 用户反馈（用于计划修订）
  userFeedback: Annotation<string>(),

  // 问题分析结果
  analysis: Annotation<QuestionAnalysis | undefined>(),

  // 研究计划
  plan: Annotation<ResearchPlan | undefined>(),

  // 已生成的章节内容（使用 reducer 合并）
  generatedContent: Annotation<ContentSection[]>({
    reducer: (last: ContentSection[], update: ContentSection[]) => last?.concat(update) ?? update,
    default: () => [],
  }),

  // 当前状态
  status: Annotation<ResearchStatus>({
    reducer: (last: ResearchStatus | undefined, update: ResearchStatus | undefined) =>
      update ?? last ?? 'analyzing',
    default: () => 'analyzing' as ResearchStatus,
  }),

  // 进度百分比 (0-100)
  progress: Annotation<number>({
    reducer: (last: number, update: number) => {
      // 负数表示增量
      if (update < 0) return last - update
      return update
    },
    default: () => 0,
  }),

  // 错误信息
  error: Annotation<string | undefined>({
    reducer: (last: string | undefined, update: string | undefined) => update ?? last,
    default: () => undefined,
  }),

  // 最终产物（Canvas artifact）
  finalArtifact: Annotation<string | undefined>({
    reducer: (last: string | undefined, update: string | undefined) => update ?? last,
    default: () => undefined,
  }),

  // 消息历史
  messages: Annotation<BaseMessage[]>({
    reducer: (last: BaseMessage[] | undefined, update: BaseMessage[] | undefined) =>
      update ?? last ?? [],
    default: () => [],
  }),

  // 计划审批状态
  approvalStatus: Annotation<PlanApprovalStatus | undefined>({
    reducer: (last: PlanApprovalStatus | undefined, update: PlanApprovalStatus | undefined) =>
      update ?? last,
    default: () => undefined,
  }),
})

export type DeepResearchState = typeof DeepResearchStateAnnotation.State
