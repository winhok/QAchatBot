import {
  analyzeTestPointsTool,
  calculatorTool,
  currentTimeTool,
  generateTestCasesTool,
  readFileTool,
  reviewTestCasesTool,
} from '../builtin'
import type { UnifiedToolConfig } from '../types'

/**
 * 统一工具配置
 *
 * 三种工具类型：
 * - custom: 自定义工具，包含 schema 和 handler
 * - langchain: LangChain 预构建工具，动态导入
 * - mcp: MCP 服务器工具
 *
 * 前端：用于工具选择器显示
 * 后端：用于加载和初始化工具
 */
export const unifiedToolsConfig: UnifiedToolConfig[] = [
  // ==================== 自定义工具 ====================
  {
    id: 'calculator',
    name: '计算器',
    description: calculatorTool.description,
    icon: '🔢',
    enabled: true,
    type: 'custom',
    schema: calculatorTool.schema,
    handler: calculatorTool.handler,
  },
  {
    id: 'current_time',
    name: '当前时间',
    description: currentTimeTool.description,
    icon: '🕐',
    enabled: true,
    type: 'custom',
    schema: currentTimeTool.schema,
    handler: currentTimeTool.handler,
  },
  {
    id: 'read_file',
    name: '文件读取',
    description: readFileTool.description,
    icon: '📄',
    enabled: true,
    type: 'custom',
    schema: readFileTool.schema,
    handler: readFileTool.handler,
  },

  // ==================== QA 测试工具 ====================
  {
    id: 'analyze_test_points',
    name: '测试点分析',
    description: analyzeTestPointsTool.description,
    icon: '📋',
    enabled: true,
    type: 'custom',
    schema: analyzeTestPointsTool.schema,
    handler: analyzeTestPointsTool.handler,
  },
  {
    id: 'generate_test_cases',
    name: '生成测试用例',
    description: generateTestCasesTool.description,
    icon: '✅',
    enabled: true,
    type: 'custom',
    schema: generateTestCasesTool.schema,
    handler: generateTestCasesTool.handler,
  },
  {
    id: 'review_test_cases',
    name: '评审测试用例',
    description: reviewTestCasesTool.description,
    icon: '🔍',
    enabled: true,
    type: 'custom',
    schema: reviewTestCasesTool.schema,
    handler: reviewTestCasesTool.handler,
  },

  // ==================== LangChain 预构建工具 ====================
  // 工具列表: https://js.langchain.com/docs/integrations/tools
  {
    id: 'tavily',
    name: 'Tavily 搜索',
    description: '使用 Tavily API 进行真实网络搜索',
    icon: '🌐',
    enabled: false, // 需要 TAVILY_API_KEY
    type: 'langchain',
    langChainTool: {
      importPath: '@langchain/tavily',
      className: 'TavilySearch',
      options: {
        maxResults: 5,
        searchDepth: 'basic',
        includeAnswer: true,
      },
    },
  },

  // ==================== MCP 工具 ====================
  {
    id: 'sequential-thinking',
    name: '顺序思考',
    description: '通过结构化的思考过程帮助 AI 解决复杂问题',
    icon: '🧠',
    enabled: false, // 可选启用
    type: 'mcp',
    mcpConfig: {
      server: 'server-sequential-thinking',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      transport: 'stdio',
    },
  },
]

/**
 * 获取所有启用的工具配置
 */
export function getEnabledToolConfigs(): UnifiedToolConfig[] {
  return unifiedToolsConfig.filter((tool) => tool.enabled)
}

/**
 * 获取自定义工具配置
 */
export function getCustomToolConfigs(): UnifiedToolConfig[] {
  return unifiedToolsConfig.filter((tool) => tool.type === 'custom' && tool.enabled)
}

/**
 * 获取 LangChain 工具配置
 */
export function getLangChainToolConfigs(): UnifiedToolConfig[] {
  return unifiedToolsConfig.filter((tool) => tool.type === 'langchain' && tool.enabled)
}

/**
 * 获取 MCP 工具配置
 */
export function getMCPToolConfigs(): UnifiedToolConfig[] {
  return unifiedToolsConfig.filter((tool) => tool.type === 'mcp' && tool.enabled)
}

/**
 * 根据 ID 获取工具配置
 */
export function getToolConfigById(id: string): UnifiedToolConfig | undefined {
  return unifiedToolsConfig.find((tool) => tool.id === id)
}

/**
 * 获取 MCP 服务器配置（用于 MultiServerMCPClient）
 */
export function getMCPServersConfig(): Record<
  string,
  { command: string; args: string[]; transport: 'stdio' | 'sse' }
> {
  const mcpTools = getMCPToolConfigs()
  const config: Record<string, { command: string; args: string[]; transport: 'stdio' | 'sse' }> = {}

  for (const tool of mcpTools) {
    if (tool.mcpConfig) {
      config[tool.mcpConfig.server] = {
        command: tool.mcpConfig.command,
        args: tool.mcpConfig.args,
        transport: tool.mcpConfig.transport,
      }
    }
  }

  return config
}

/**
 * 环境配置中默认启用的工具 ID 列表
 */
export const environmentDefaults = {
  development: ['calculator', 'current_time', 'read_file'],
  production: ['calculator', 'current_time'],
  test: ['calculator', 'current_time'],
}

/**
 * 获取当前环境的默认工具列表
 */
export function getDefaultToolsForEnv(
  env: string = process.env.NODE_ENV || 'development',
): string[] {
  return (
    environmentDefaults[env as keyof typeof environmentDefaults] || environmentDefaults.development
  )
}
