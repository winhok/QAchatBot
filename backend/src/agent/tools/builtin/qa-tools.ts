/**
 * QA 测试工具集
 * 将原 qa-chatbot 工作流的能力转化为可调用的工具
 *
 * 支持两种模式：
 * 1. MCP 模式：从 qa-templates MCP 服务器动态加载模板
 * 2. 降级模式：使用内置硬编码提示词
 */
import { QA_REVIEW_PROMPT, QA_TEST_CASES_PROMPT, QA_TEST_POINTS_PROMPT } from '@/agent/prompts'
import { TemplateService } from '@/agent/templates'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import type { ToolDefinition } from '../types'

// Template service instance (lazy initialized)
let templateService: TemplateService | null = null

/**
 * Set the template service instance (called from NestJS module)
 */
export function setTemplateService(service: TemplateService): void {
  templateService = service
}

/**
 * Get template with fallback to hardcoded prompts
 */
function getTemplateWithFallback(toolName: string, fallbackPrompt: string): string {
  if (!templateService?.isReady()) {
    return fallbackPrompt
  }

  try {
    const template = templateService.getTemplatesForNode(toolName)
    return template || fallbackPrompt
  } catch {
    console.warn(`Failed to load template for ${toolName}, using fallback`)
    return fallbackPrompt
  }
}

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

/**
 * 构建 QA 系统提示词
 */
function buildSystemPrompt(toolName: string, fallbackPrompt: string): string {
  const template = getTemplateWithFallback(toolName, fallbackPrompt)
  return `你是一个专业的QA测试专家。\n\n${template}`
}

/**
 * 格式标签映射
 */
const FORMAT_LABELS: Record<string, string> = {
  csv: 'CSV 格式',
  table: '表格格式',
  markdown: 'Markdown 格式',
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
    const systemPrompt = buildSystemPrompt('analyze_test_points', QA_TEST_POINTS_PROMPT)

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
    const systemPrompt = buildSystemPrompt('generate_test_cases', QA_TEST_CASES_PROMPT)
    const formatLabel = FORMAT_LABELS[format] || FORMAT_LABELS.csv

    const userContent = `请根据以下测试点生成测试用例：

${testPoints}

输出格式要求：${formatLabel}`

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
    const systemPrompt = buildSystemPrompt('review_test_cases', QA_REVIEW_PROMPT)

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
