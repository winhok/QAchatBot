import type { StructuredToolInterface } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * 工具定义接口（用于定义自定义工具）
 * 向后兼容 builtin 工具使用
 */
export interface ToolDefinition<T = Record<string, unknown>> {
  name: string
  description: string
  schema: z.ZodSchema<T>
  handler: (params: T) => Promise<string> | string
}

/**
 * 工具类型
 * - custom: 自定义工具，包含 schema 和 handler
 * - langchain: LangChain 预构建工具，动态导入
 * - mcp: MCP 服务器工具
 */
export type ToolType = 'custom' | 'langchain' | 'mcp'

/**
 * LangChain 预构建工具配置
 */
export interface LangChainToolConfig {
  /** 模块导入路径，如 '@langchain/tavily' */
  importPath: string
  /** 类名，如 'TavilySearch' */
  className: string
  /** 工具选项 */
  options?: Record<string, unknown>
}

/**
 * MCP 工具配置
 */
export interface MCPToolConfig {
  /** MCP 服务器名称 */
  server: string
  /** 启动命令 */
  command: string
  /** 命令参数 */
  args: string[]
  /** 工作目录 */
  cwd?: string
  /** 传输协议 */
  transport: 'stdio' | 'sse'
}

/**
 * 自定义工具处理器
 */
export type ToolHandler<T = Record<string, unknown>> = (params: T) => Promise<string> | string

/**
 * 统一工具配置接口
 */
export interface UnifiedToolConfig<T = Record<string, unknown>> {
  /** 工具唯一 ID */
  id: string
  /** 工具显示名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 工具图标 */
  icon?: string
  /** 是否启用 */
  enabled: boolean
  /** 工具类型 */
  type: ToolType

  // ===== 自定义工具配置 =====
  /** 参数 Schema（自定义工具必需） */
  schema?: z.ZodSchema<T>
  /** 处理函数（自定义工具必需） */
  handler?: ToolHandler<T>
  /** 额外选项 */
  options?: Record<string, unknown>

  // ===== LangChain 工具配置 =====
  /** LangChain 预构建工具配置 */
  langChainTool?: LangChainToolConfig

  // ===== MCP 工具配置 =====
  /** MCP 工具配置 */
  mcpConfig?: MCPToolConfig
}

/**
 * 内部工具配置（已转换为 LangChain 工具）
 */
export interface LoadedTool {
  id: string
  type: ToolType
  tool: StructuredToolInterface
}
