import { RunnableConfig } from '@langchain/core/runnables'
import { StructuredToolInterface, tool } from '@langchain/core/tools'
import { z } from 'zod'
import { addToolConfig, disableTool, enableTool, getCurrentEnvironmentConfig, getEnabledToolsConfig, removeTool, ToolConfig } from './config/tools.config'

let toolsCache: StructuredToolInterface[] | null = null
let toolsMapCache: Record<string, StructuredToolInterface> | null = null

function createToolFromConfig(config: ToolConfig): StructuredToolInterface {
  return tool(config.handler, {
    name: config.name,
    description: config.description,
    schema: config.schema,
  })
}

function invalidateCache() {
  toolsCache = null
  toolsMapCache = null
}

export function getAllTools(): StructuredToolInterface[] {
  if (toolsCache) return toolsCache
  const enabledConfig = getEnabledToolsConfig()
  toolsCache = Object.values(enabledConfig).map(createToolFromConfig)
  return toolsCache
}

export function getToolsMap(): Record<string, StructuredToolInterface> {
  if (toolsMapCache) return toolsMapCache
  const enabledConfigs = getEnabledToolsConfig()
  toolsMapCache = {}
  for (const [name, config] of Object.entries(enabledConfigs)) {
    toolsMapCache[name] = createToolFromConfig(config)
  }
  return toolsMapCache
}

export function getTool(name: string): StructuredToolInterface {
  const map = getToolsMap()
  const t = map[name]
  if (!t) throw new Error(`Tool "${name}" not found or not enabled`)
  return t
}

export function getToolsFromConfig(config?: RunnableConfig): StructuredToolInterface[] {
  if (config?.configurable?.tools) return config.configurable.tools
  return getAllTools()
}

export function isToolEnabled(name: string): boolean {
  return !!getEnabledToolsConfig()[name]
}

export function getEnabledToolNames(): string[] {
  return Array.from(getCurrentEnvironmentConfig().enabledTools)
}

export function getToolInfo(name: string) {
  const config = getEnabledToolsConfig()[name]
  if (!config) return null
  return {
    name: config.name,
    description: config.description,
    enabled: config.enabled,
    options: config.options,
  }
}

export function getAllToolsInfo() {
  return Object.values(getEnabledToolsConfig()).map(config => ({
    name: config.name,
    description: config.description,
    enabled: config.enabled,
    options: config.options,
  }))
}

type ToolHandler<T> = (params: T) => Promise<string> | string

interface AddToolOptions<T> {
  description: string
  schema: z.ZodSchema<T>
  handler: ToolHandler<T>
  enabled?: boolean
  options?: Record<string, unknown>
}

export const toolManager = {
  add<T = Record<string, unknown>>(name: string, opts: AddToolOptions<T>) {
    addToolConfig(name, {
      description: opts.description,
      schema: opts.schema,
      handler: opts.handler as ToolHandler<Record<string, unknown>>,
      enabled: opts.enabled ?? true,
      options: opts.options,
    })
    invalidateCache()
    return this
  },

  addMany(tools: Record<string, AddToolOptions<unknown>>) {
    for (const [name, opts] of Object.entries(tools)) {
      this.add(name, opts)
    }
    return this
  },

  remove(name: string) {
    removeTool(name)
    invalidateCache()
    return this
  },

  disable(name: string) {
    disableTool(name)
    invalidateCache()
    return this
  },

  enable(name: string) {
    enableTool(name)
    invalidateCache()
    return this
  },

  get(name: string) {
    return { exists: isToolEnabled(name), info: getToolInfo(name) }
  },

  list() {
    return getAllToolsInfo()
  },

  getAll() {
    return getAllTools()
  },
}

export function createAgentToolsConfig() {
  const envConfig = getCurrentEnvironmentConfig()
  return {
    enabledTools: Array.from(envConfig.enabledTools),
    debugMode: envConfig.debugMode,
    tools: getAllTools(),
    toolsMap: getToolsMap(),
  }
}
