import { z } from 'zod'
import { MessageContentBlockSchema } from './content-blocks'
import { HttpMethodSchema, MessageRoleSchema, ToolStatusSchema, ToolTypeSchema } from './enums'

export const ToolCallDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ToolTypeSchema,
  status: ToolStatusSchema,
  duration: z.number().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
})

export const ApiResultDataSchema = z.object({
  method: HttpMethodSchema,
  url: z.string(),
  statusCode: z.number(),
  duration: z.number(),
  responseBody: z.unknown(),
  headers: z.record(z.string(), z.string()).optional(),
})

export const MessageSchema = z.object({
  id: z.string(),
  content: z.union([z.string(), z.array(MessageContentBlockSchema)]),
  role: MessageRoleSchema,
  timestamp: z.date(),
  isStreaming: z.boolean().optional(),
  toolCalls: z.array(ToolCallDataSchema).optional(),
  apiResult: ApiResultDataSchema.optional(),
  usage_metadata: z
    .object({
      input_tokens: z.number(),
      output_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
})

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
})

export type ToolCallData = z.infer<typeof ToolCallDataSchema>
export type ApiResultData = z.infer<typeof ApiResultDataSchema>
export type Message = z.infer<typeof MessageSchema>
export type Session = z.infer<typeof SessionSchema>
