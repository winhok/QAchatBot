import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ToolDefinition } from '../tools.registry';

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description:
    '读取文件内容。当需要读取文件、查看代码、分析文件内容时使用此工具。支持相对路径和绝对路径。',
  schema: z.object({
    filePath: z.string().describe('要读取的文件路径（相对路径或绝对路径）'),
  }),
  handler: async ({ filePath }: { filePath: string }) => {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return `文件: ${filePath}\n内容:\n${content}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `读取文件失败: ${message}`;
    }
  },
};
