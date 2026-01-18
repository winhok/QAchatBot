import { z } from 'zod'
import { ChatMessageContentBlockSchema } from './content-blocks'
import { SessionStatusSchema } from './enums'

// ========== Session Schemas ==========

export const CreateSessionRequestSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().optional(),
  folderId: z.string().cuid().optional(),
})

export const DeleteSessionRequestSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
})

export const UpdateSessionRequestSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  name: z.string().optional(),
  status: SessionStatusSchema.optional(),
  folderId: z.string().cuid().nullable().optional(),
})

export const ChatMessageContentSchema = z.union([
  z.string().min(1, 'Message is required'),
  z.array(ChatMessageContentBlockSchema).min(1, 'Message content is required'),
])

export const ChatRequestSchema = z.object({
  message: ChatMessageContentSchema,
  session_id: z.string().cuid().optional(),
  model_id: z.string().optional(),
  tools: z.array(z.string()).optional(),
})

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>
export type DeleteSessionRequest = z.infer<typeof DeleteSessionRequestSchema>
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>
export type ChatMessageContent = z.infer<typeof ChatMessageContentSchema>
export type ChatRequest = z.infer<typeof ChatRequestSchema>

// ========== Folder Schemas ==========

export const MemoryCategorySchema = z.enum(['prefs', 'rules', 'knowledge', 'context'])

export const CreateFolderRequestSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  userId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
})

export const UpdateFolderRequestSchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
})

export const AddMemoryRequestSchema = z.object({
  category: MemoryCategorySchema,
  key: z.string().min(1, 'Key is required'),
  value: z.unknown(),
  priority: z.number().optional(),
})

export const MoveSessionsRequestSchema = z.object({
  sessionIds: z.array(z.string().cuid()),
})

export type MemoryCategory = z.infer<typeof MemoryCategorySchema>
export type CreateFolderRequest = z.infer<typeof CreateFolderRequestSchema>
export type UpdateFolderRequest = z.infer<typeof UpdateFolderRequestSchema>
export type AddMemoryRequest = z.infer<typeof AddMemoryRequestSchema>
export type MoveSessionsRequest = z.infer<typeof MoveSessionsRequestSchema>
