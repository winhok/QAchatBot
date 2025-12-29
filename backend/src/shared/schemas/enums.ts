import { z } from 'zod';

export const SessionTypeSchema = z.enum(['normal', 'testcase']);

export const SessionStatusSchema = z.enum(['active', 'archived', 'deleted']);

export const ToolStatusSchema = z.enum(['running', 'success', 'error']);

export const ToolTypeSchema = z.enum(['api', 'database', 'script']);

export const HttpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
]);

export const MessageRoleSchema = z.enum([
  'system',
  'user',
  'assistant',
  'tool',
]);

export const ToolCallStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'error',
]);

export type SessionType = z.infer<typeof SessionTypeSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type ToolStatus = z.infer<typeof ToolStatusSchema>;
export type ToolType = z.infer<typeof ToolTypeSchema>;
export type HttpMethod = z.infer<typeof HttpMethodSchema>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;
