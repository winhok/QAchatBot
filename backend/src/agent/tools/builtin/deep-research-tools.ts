/**
 * 深度研究工具集
 * 参考 langgraphjs-chat-app 架构，实现为独立工具
 *
 * 工作流程：
 * 1. analyze_research_topic - 分析研究主题，生成研究计划
 * 2. research_section - 对单个章节进行搜索和内容生成
 * 3. generate_research_report - 汇总所有章节，生成最终报告
 */
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import type { ToolDefinition } from '../types'

// ==================== Prompts ====================

const ANALYZE_TOPIC_PROMPT = `你是一位资深的研究分析专家。请分析用户提供的研究主题，并生成一个结构化的研究计划。

你需要输出：
1. **研究主题概述**：简要描述研究主题和背景
2. **研究目标**：列出 3-5 个具体的研究目标
3. **研究章节**：规划 3-6 个研究章节，每个章节包含：
   - 标题
   - 描述
   - 关键搜索词

请以 JSON 格式输出，结构如下：
{
  "title": "研究主题标题",
  "description": "研究主题概述",
  "objectives": ["目标1", "目标2", ...],
  "sections": [
    {"title": "章节1标题", "description": "章节描述", "keywords": ["关键词1", "关键词2"]}
  ]
}`

const RESEARCH_SECTION_PROMPT = `你是一位专业的研究员。请根据提供的章节信息进行深入研究，生成该章节的内容。

研究要求：
1. 内容要详实、有深度
2. 结构清晰，使用 Markdown 格式
3. 如有相关数据或案例，请引用说明
4. 字数控制在 500-1000 字

请直接输出章节内容（Markdown 格式），不要包含 JSON 包装。`

const GENERATE_REPORT_PROMPT = `你是一位专业的研究报告撰写专家。请根据提供的各章节研究内容，生成一份完整的、结构化的深度研究报告。

报告要求：
1. 包含标题和摘要
2. 整合所有章节内容，保持逻辑连贯
3. 添加引言和结论
4. 使用专业的 Markdown 格式
5. 突出关键发现和洞察

输出格式：
# 报告标题

## 摘要
[简要概述]

## 引言
[背景介绍]

## [各章节内容]

## 结论
[总结关键发现]`

// ==================== 工具函数 ====================

function getResearchModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
    temperature: 0.3,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  })
}

// ==================== 工具 1: 分析研究主题 ====================

export const analyzeResearchTopicTool: ToolDefinition<{ topic: string; context?: string }> = {
  name: 'analyze_research_topic',
  description:
    '分析研究主题，生成结构化的研究计划。这是深度研究的第一步，用于规划研究方向和章节。输出包含研究目标和章节规划的 JSON 结构。',
  schema: z.object({
    topic: z.string().describe('研究主题或问题'),
    context: z.string().optional().describe('额外的背景信息或特定要求'),
  }),
  handler: async ({ topic, context }) => {
    const model = getResearchModel()

    const userContent = context
      ? `研究主题：${topic}\n\n额外背景/要求：${context}`
      : `研究主题：${topic}`

    console.log('[DeepResearch] Analyzing topic:', topic)

    const response = await model.invoke([
      { role: 'system', content: ANALYZE_TOPIC_PROMPT },
      { role: 'user', content: userContent },
    ])

    const content = response.content as string

    console.log('[DeepResearch] Analysis complete')

    return `研究计划已生成：\n\n${content}`
  },
}

// ==================== 工具 2: 研究单个章节 ====================

export const researchSectionTool: ToolDefinition<{
  sectionTitle: string
  sectionDescription: string
  keywords: string[]
  researchContext?: string
}> = {
  name: 'research_section',
  description:
    '对研究计划中的单个章节进行深入研究，生成该章节的详细内容。需要提供章节标题、描述和关键词。',
  schema: z.object({
    sectionTitle: z.string().describe('章节标题'),
    sectionDescription: z.string().describe('章节描述'),
    keywords: z.array(z.string()).describe('搜索关键词列表'),
    researchContext: z.string().optional().describe('整体研究的上下文信息'),
  }),
  handler: async ({ sectionTitle, sectionDescription, keywords, researchContext }) => {
    const model = getResearchModel()

    const userContent = `## 章节信息
- **标题**：${sectionTitle}
- **描述**：${sectionDescription}
- **关键词**：${keywords.join(', ')}
${researchContext ? `\n## 研究上下文\n${researchContext}` : ''}

请生成该章节的研究内容。`

    console.log('[DeepResearch] Researching section:', sectionTitle)

    const response = await model.invoke([
      { role: 'system', content: RESEARCH_SECTION_PROMPT },
      { role: 'user', content: userContent },
    ])

    const content = response.content as string

    console.log('[DeepResearch] Section research complete:', sectionTitle)

    return `## ${sectionTitle}\n\n${content}`
  },
}

// ==================== 工具 3: 生成研究报告 ====================

export const generateResearchReportTool: ToolDefinition<{
  title: string
  sections: string[]
  objectives?: string[]
}> = {
  name: 'generate_research_report',
  description:
    '汇总所有研究章节，生成完整的深度研究报告。这是深度研究的最后一步。需要提供报告标题和各章节内容。',
  schema: z.object({
    title: z.string().describe('研究报告标题'),
    sections: z.array(z.string()).describe('各章节的研究内容'),
    objectives: z.array(z.string()).optional().describe('研究目标列表'),
  }),
  handler: async ({ title, sections, objectives }) => {
    const model = getResearchModel()

    const sectionsContent = sections.join('\n\n---\n\n')
    const objectivesText = objectives
      ? `\n\n**研究目标**：\n${objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
      : ''

    const userContent = `# ${title}${objectivesText}

## 各章节研究内容

${sectionsContent}

请根据以上内容生成完整的研究报告。`

    console.log('[DeepResearch] Generating final report:', title)

    const response = await model.invoke([
      { role: 'system', content: GENERATE_REPORT_PROMPT },
      { role: 'user', content: userContent },
    ])

    const content = response.content as string

    console.log('[DeepResearch] Report generation complete')

    return content
  },
}

// ==================== 导出所有工具 ====================

export const deepResearchTools = [
  analyzeResearchTopicTool,
  researchSectionTool,
  generateResearchReportTool,
]
