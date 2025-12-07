import { z } from 'zod'

export interface ToolConfig<T = Record<string, unknown>> {
  name: string
  description: string
  enabled: boolean
  schema: z.ZodSchema
  handler: (params: T) => Promise<string> | string
  options?: Record<string, unknown>
}

export const toolsConfig: Record<string, ToolConfig> = {}

interface EnvConfig {
  enabledTools: Set<string>
  debugMode: boolean
}

const runtimeConfig: Record<string, EnvConfig> = {
  development: { enabledTools: new Set(), debugMode: true },
  production: { enabledTools: new Set(), debugMode: false },
  test: { enabledTools: new Set(), debugMode: true },
}

export function getCurrentEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development'
  return runtimeConfig[env] || runtimeConfig.development
}

export function getEnabledToolsConfig(): Record<string, ToolConfig> {
  const envConfig = getCurrentEnvironmentConfig()
  const enabledTools: Record<string, ToolConfig> = {}
  for (const toolName of envConfig.enabledTools) {
    const toolConfig = toolsConfig[toolName]
    if (toolConfig && toolConfig.enabled) {
      enabledTools[toolName] = toolConfig
    }
  }
  return enabledTools
}

export function validateToolConfig(config: ToolConfig): boolean {
  return !!(config.name && config.description && config.schema && typeof config.handler === 'function' && typeof config.enabled === 'boolean')
}

export function addToolConfig<T = Record<string, unknown>>(name: string, config: Omit<ToolConfig<T>, 'name'>, autoEnable = true) {
  const fullConfig: ToolConfig<T> = { name, ...config }
  if (!validateToolConfig(fullConfig as ToolConfig<Record<string, unknown>>)) {
    throw new Error(`Invalid tool configuration for ${name}`)
  }
  toolsConfig[name] = fullConfig as ToolConfig
  if (autoEnable) {
    const envConfig = getCurrentEnvironmentConfig()
    envConfig.enabledTools.add(name)
  }
}

export function disableTool(name: string) {
  if (toolsConfig[name]) {
    toolsConfig[name].enabled = false
  }
}

export function enableTool(name: string) {
  if (toolsConfig[name]) {
    toolsConfig[name].enabled = true
    const envConfig = getCurrentEnvironmentConfig()
    envConfig.enabledTools.add(name)
  }
}

export function removeTool(name: string) {
  delete toolsConfig[name]
  const envConfig = getCurrentEnvironmentConfig()
  envConfig.enabledTools.delete(name)
}
