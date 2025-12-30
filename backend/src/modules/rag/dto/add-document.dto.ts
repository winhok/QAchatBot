import { z } from 'zod';

/**
 * 添加单个文档的请求 Schema
 */
export const AddDocumentSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  collection: z.string().optional().default('default'),
});

export type AddDocumentDto = z.infer<typeof AddDocumentSchema>;

/**
 * 批量添加文档的请求 Schema
 */
export const AddDocumentsSchema = z.object({
  documents: z
    .array(
      z.object({
        content: z.string().min(1),
        metadata: z.record(z.string(), z.any()).optional().default({}),
      }),
    )
    .min(1, '至少需要一个文档'),
  collection: z.string().optional().default('default'),
});

export type AddDocumentsDto = z.infer<typeof AddDocumentsSchema>;
