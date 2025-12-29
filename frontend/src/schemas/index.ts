import { z } from 'zod'

// ============================================================================
// 基础枚举 Schemas
// ============================================================================

export const SessionTypeSchema = z.enum(['normal', 'testcase'])

export const ToolStatusSchema = z.enum(['running', 'success', 'error'])

export const ToolTypeSchema = z.enum(['api', 'database', 'script'])

export const HttpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
])

export const MessageRoleSchema = z.enum(['user', 'assistant'])

// ============================================================================
// 数据模型 Schemas
// ============================================================================

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

// 文本内容块
export const TextContentBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

// 图片内容块（支持 Base64 和 HTTP URL）
export const ImageContentBlockSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
})

// 媒体内容块（视频、音频）
export const MediaContentBlockSchema = z.object({
  type: z.literal('media'),
  media: z.object({
    mimeType: z.string(),
    url: z.string(),
  }),
})

// 文档内容块（PDF 等）
export const DocumentContentBlockSchema = z.object({
  type: z.literal('document'),
  document: z.object({
    mimeType: z.string(),
    url: z.string(),
  }),
})

// 工具调用内容块
export const ToolCallContentBlockSchema = z.object({
  type: z.literal('tool_call'),
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
})

// 所有内容块类型的联合
export const MessageContentBlockSchema = z.union([
  TextContentBlockSchema,
  ImageContentBlockSchema,
  MediaContentBlockSchema,
  DocumentContentBlockSchema,
  ToolCallContentBlockSchema,
])

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
  type: SessionTypeSchema,
  created_at: z.string(),
})

// ============================================================================
// API 请求 Schemas
// ============================================================================

export const CreateSessionRequestSchema = z.object({
  name: z.string().optional(),
  type: SessionTypeSchema.default('normal'),
})

export const DeleteSessionRequestSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
})

export const UpdateSessionRequestSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  name: z.string().min(1, 'Name is required'),
  type: SessionTypeSchema.default('normal'),
})

// 聊天消息内容 Schema（支持纯文本或多模态内容块数组）
// 用于 API 请求，排除 tool_call 类型（仅用于 AI 响应）
export const ChatMessageContentBlockSchema = z.union([
  TextContentBlockSchema,
  ImageContentBlockSchema,
  MediaContentBlockSchema,
  DocumentContentBlockSchema,
])

export const ChatMessageContentSchema = z.union([
  z.string().min(1, 'Message is required'),
  z.array(ChatMessageContentBlockSchema).min(1, 'Message content is required'),
])

export const ChatRequestSchema = z.object({
  message: ChatMessageContentSchema,
  session_id: z.string().cuid('Invalid session_id').optional(),
  model_id: z.string().optional(),
  session_type: SessionTypeSchema.optional(),
})

// ============================================================================
// 类型导出 (从 Schemas 推断)
// ============================================================================

export type SessionType = z.infer<typeof SessionTypeSchema>
export type ToolStatus = z.infer<typeof ToolStatusSchema>
export type ToolType = z.infer<typeof ToolTypeSchema>
export type HttpMethod = z.infer<typeof HttpMethodSchema>
export type MessageRole = z.infer<typeof MessageRoleSchema>

// 内容块类型
export type TextContentBlock = z.infer<typeof TextContentBlockSchema>
export type ImageContentBlock = z.infer<typeof ImageContentBlockSchema>
export type MediaContentBlock = z.infer<typeof MediaContentBlockSchema>
export type DocumentContentBlock = z.infer<typeof DocumentContentBlockSchema>
export type ToolCallContentBlock = z.infer<typeof ToolCallContentBlockSchema>
export type MessageContentBlock = z.infer<typeof MessageContentBlockSchema>
export type ChatMessageContentBlock = z.infer<
  typeof ChatMessageContentBlockSchema
>
export type ChatMessageContent = z.infer<typeof ChatMessageContentSchema>

export type ToolCallData = z.infer<typeof ToolCallDataSchema>
export type ApiResultData = z.infer<typeof ApiResultDataSchema>
export type Message = z.infer<typeof MessageSchema>
export type Session = z.infer<typeof SessionSchema>

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>
export type DeleteSessionRequest = z.infer<typeof DeleteSessionRequestSchema>
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>
export type ChatRequest = z.infer<typeof ChatRequestSchema>

// ============================================================================
// API 响应 Schemas (用于运行时校验)
// ============================================================================

export const GetSessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
})

export const CreateSessionResponseSchema = z.object({
  session_id: z.string(),
  name: z.string(),
  type: SessionTypeSchema,
})

export const UpdateSessionResponseSchema = z.object({
  success: z.boolean(),
})

export const DeleteSessionResponseSchema = z.object({
  success: z.boolean(),
})

export type GetSessionsResponse = z.infer<typeof GetSessionsResponseSchema>
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>
export type UpdateSessionResponse = z.infer<typeof UpdateSessionResponseSchema>
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>
