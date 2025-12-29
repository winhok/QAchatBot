import { z } from 'zod';
import { SessionStatusSchema, SessionTypeSchema } from './enums';
import { ChatMessageContentBlockSchema } from './content-blocks';

export const CreateSessionRequestSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().optional(),
  type: SessionTypeSchema.default('normal'),
});

export const DeleteSessionRequestSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
});

export const UpdateSessionRequestSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  name: z.string().optional(),
  type: SessionTypeSchema.optional(),
  status: SessionStatusSchema.optional(),
});

export const ChatMessageContentSchema = z.union([
  z.string().min(1, 'Message is required'),
  z.array(ChatMessageContentBlockSchema).min(1, 'Message content is required'),
]);

export const ChatRequestSchema = z.object({
  message: ChatMessageContentSchema,
  session_id: z.string().cuid().optional(),
  model_id: z.string().optional(),
  session_type: SessionTypeSchema.optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type DeleteSessionRequest = z.infer<typeof DeleteSessionRequestSchema>;
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>;
export type ChatMessageContent = z.infer<typeof ChatMessageContentSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
