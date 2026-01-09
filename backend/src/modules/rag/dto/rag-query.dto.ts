import { z } from 'zod'

/**
 * RAG 查询请求 Schema
 */
export const RagQuerySchema = z.object({
  question: z.string().min(1, '问题不能为空'),
  collection: z.string().optional().default('default'),
  topK: z.number().int().min(1).max(20).optional().default(5),
  relevanceThreshold: z.number().min(0).max(1).optional().default(0.3),
})

export type RagQueryDto = z.infer<typeof RagQuerySchema>

/**
 * RAG 对话式查询请求 Schema
 */
export const ConversationalRagQuerySchema = z.object({
  question: z.string().min(1, '问题不能为空'),
  sessionId: z.string().optional(),
  collection: z.string().optional().default('default'),
  topK: z.number().int().min(1).max(20).optional().default(5),
})

export type ConversationalRagQueryDto = z.infer<typeof ConversationalRagQuerySchema>
