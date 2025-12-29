import { z } from 'zod';

export const TextContentBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const ImageContentBlockSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(['auto', 'low', 'high']).optional(),
  }),
});

export const MediaContentBlockSchema = z.object({
  type: z.literal('media'),
  media: z.object({
    mimeType: z.string(),
    url: z.string(),
  }),
});

export const DocumentContentBlockSchema = z.object({
  type: z.literal('document'),
  document: z.object({
    mimeType: z.string(),
    url: z.string(),
  }),
});

export const ToolCallContentBlockSchema = z.object({
  type: z.literal('tool_call'),
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
});

export const MessageContentBlockSchema = z.union([
  TextContentBlockSchema,
  ImageContentBlockSchema,
  MediaContentBlockSchema,
  DocumentContentBlockSchema,
  ToolCallContentBlockSchema,
]);

export const ChatMessageContentBlockSchema = z.union([
  TextContentBlockSchema,
  ImageContentBlockSchema,
  MediaContentBlockSchema,
  DocumentContentBlockSchema,
]);

export type TextContentBlock = z.infer<typeof TextContentBlockSchema>;
export type ImageContentBlock = z.infer<typeof ImageContentBlockSchema>;
export type MediaContentBlock = z.infer<typeof MediaContentBlockSchema>;
export type DocumentContentBlock = z.infer<typeof DocumentContentBlockSchema>;
export type ToolCallContentBlock = z.infer<typeof ToolCallContentBlockSchema>;
export type MessageContentBlock = z.infer<typeof MessageContentBlockSchema>;
export type ChatMessageContentBlock = z.infer<
  typeof ChatMessageContentBlockSchema
>;
