import { z } from 'zod';
import type { ToolDefinition } from '../tools.registry';

export const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: '计算数学表达式',
  schema: z.object({
    expression: z.string().describe('数学表达式，如 2+2*3'),
  }),
  handler: ({ expression }: { expression: string }) => {
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return `${expression} = ${result}`;
    } catch {
      return `无法计算: ${expression}`;
    }
  },
};
