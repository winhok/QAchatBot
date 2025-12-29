/**
 * 多模型配置文件
 *
 * 所有模型均使用同一个 OpenAI 兼容的中转站 API
 * 环境变量配置：
 * - OPENAI_API_KEY: API 密钥
 * - OPENAI_BASE_URL: 中转站地址
 */

export interface ModelConfig {
  id: string
  name: string
  description: string
  modelName: string // 实际调用 API 时使用的模型名称
}

// 可用的模型列表
export const models: Array<ModelConfig> = [
  {
    id: 'gpt-5.2-high',
    name: 'gpt-5.2-high',
    description: 'gpt-5.2-high',
    modelName: 'gpt-5.2-high',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'gemini-3-pro-preview',
    description: 'gemini-3-pro-preview',
    modelName: 'gemini-3-pro-preview',
  },
]

// 默认模型 ID
export const DEFAULT_MODEL_ID = 'qwen-plus'

/**
 * 根据模型 ID 获取模型配置
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return models.find((m) => m.id === modelId)
}

/**
 * 根据模型 ID 获取实际的模型名称
 */
export function getModelName(modelId: string): string {
  const config = getModelConfig(modelId)
  return config?.modelName || modelId
}
