import { z } from 'zod';
import type { ToolDefinition } from '../tools.registry';

export const currentTimeTool: ToolDefinition = {
  name: 'current_time',
  description: 'Get the current time',
  schema: z.object({}),
  handler: async () => {
    const date = new Date();
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai',
      timeZoneName: 'short',
    });
  },
};
