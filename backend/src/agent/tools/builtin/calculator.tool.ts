import { z } from 'zod';
import type { ToolDefinition } from '../tools.registry';

/**
 * 安全的数学表达式计算器
 * 只支持基本的数学运算：+ - * / % ( ) 和数字
 */
function safeEval(expression: string): number {
  // 验证表达式只包含允许的字符
  const sanitized = expression.replace(/\s/g, '');
  if (!/^[\d+\-*/%().]+$/.test(sanitized)) {
    throw new Error('Invalid characters in expression');
  }

  // 使用递归下降解析器进行安全计算
  let pos = 0;
  const str = sanitized;

  function parseNumber(): number {
    let numStr = '';
    while (pos < str.length && /[\d.]/.test(str[pos])) {
      numStr += str[pos++];
    }
    if (!numStr) throw new Error('Expected number');
    return parseFloat(numStr);
  }

  function parseFactor(): number {
    if (str[pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      if (str[pos] !== ')') throw new Error('Expected )');
      pos++; // skip ')'
      return result;
    }
    if (str[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < str.length && /[*/%]/.test(str[pos])) {
      const op = str[pos++];
      const right = parseFactor();
      if (op === '*') result *= right;
      else if (op === '/') result /= right;
      else if (op === '%') result %= right;
    }
    return result;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < str.length && /[+-]/.test(str[pos]) && str[pos - 1] !== '(') {
      const op = str[pos++];
      const right = parseTerm();
      if (op === '+') result += right;
      else result -= right;
    }
    return result;
  }

  const result = parseExpression();
  if (pos < str.length) throw new Error('Unexpected character');
  return result;
}

export const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: '计算数学表达式',
  schema: z.object({
    expression: z.string().describe('数学表达式，如 2+2*3'),
  }),
  handler: ({ expression }: { expression: string }) => {
    try {
      const result = safeEval(expression);
      return `${expression} = ${result}`;
    } catch {
      return `无法计算: ${expression}`;
    }
  },
};
