/**
 * QA 测试工具集
 * 将原 qa-chatbot 工作流的能力转化为可调用的工具
 */
import { QA_REVIEW_PROMPT, QA_TEST_CASES_PROMPT, QA_TEST_POINTS_PROMPT } from '@/agent/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import type { ToolDefinition } from '../types'

/**
 * 获取 QA 专用的 LLM 实例
 */
function getQaModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
    temperature: 0.1,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  })
}

// ==================== 工具 1: 测试点分析 ====================

export const analyzeTestPointsTool: ToolDefinition<{ prdContent: string }> = {
  name: 'analyze_test_points',
  description:
    '分析 PRD 需求文档，提取功能测试点。当用户提供需求文档并希望进行测试分析时使用。输入完整的需求描述，输出结构化的测试点列表。',
  schema: z.object({
    prdContent: z.string().describe('PRD 需求文档内容或功能描述'),
  }),
  handler: async ({ prdContent }) => {
    const model = getQaModel()
    const systemPrompt = `你是一个专业的QA测试专家。\n\n${QA_TEST_POINTS_PROMPT}`

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prdContent },
    ])

    return response.content as string
  },
}

// ==================== 工具 2: 生成测试用例 ====================

export const generateTestCasesTool: ToolDefinition<{
  testPoints: string
  format?: 'markdown' | 'csv' | 'table'
}> = {
  name: 'generate_test_cases',
  description:
    '根据测试点生成详细的测试用例。需要先使用 analyze_test_points 工具获取测试点，然后基于测试点生成用例。',
  schema: z.object({
    testPoints: z.string().describe('测试点列表（可以是 analyze_test_points 的输出）'),
    format: z.enum(['markdown', 'csv', 'table']).optional().describe('输出格式，默认为 csv'),
  }),
  handler: async ({ testPoints, format = 'csv' }) => {
    const model = getQaModel()
    const systemPrompt = `你是一个专业的QA测试专家。\n\n${QA_TEST_CASES_PROMPT}`

    const userContent = `请根据以下测试点生成测试用例：

${testPoints}

输出格式要求：${format === 'csv' ? 'CSV 格式' : format === 'table' ? '表格格式' : 'Markdown 格式'}`

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ])

    return response.content as string
  },
}

// ==================== 工具 3: 评审测试用例 ====================

export const reviewTestCasesTool: ToolDefinition<{
  testCases: string
  feedback?: string
}> = {
  name: 'review_test_cases',
  description:
    '评审并优化测试用例，可接受用户反馈进行修改。用于检查用例的覆盖度、设计质量，并输出优化后的最终版本。',
  schema: z.object({
    testCases: z.string().describe('待评审的测试用例'),
    feedback: z.string().optional().describe('用户的修改意见或特殊要求'),
  }),
  handler: async ({ testCases, feedback }) => {
    const model = getQaModel()
    const systemPrompt = `你是一个专业的QA测试专家。\n\n${QA_REVIEW_PROMPT}`

    const userContent = feedback
      ? `请评审以下测试用例，并根据用户反馈进行优化：

测试用例：
${testCases}

用户反馈：
${feedback}`
      : `请评审并优化以下测试用例：

${testCases}`

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ])

    return response.content as string
  },
}
