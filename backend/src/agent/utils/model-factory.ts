import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 模型提供商类型
 */
export type ModelProvider = 'openai' | 'google';

/**
 * 解析后的模型 ID
 */
export interface ParsedModelId {
  provider: ModelProvider;
  modelName: string;
}

/**
 * 模型工厂服务
 *
 * 支持多个 AI 提供商的统一模型创建接口：
 * - `openai:gpt-4o` - OpenAI 兼容 API
 * - `google:gemini-2.5-flash` - Google Gemini
 * - `qwen-max` - 默认使用 OpenAI 兼容 API
 */
@Injectable()
export class ModelFactory {
  constructor(private readonly config: ConfigService) {}

  /**
   * 解析模型 ID
   * @param modelId 模型 ID，格式为 "provider:modelName" 或仅 "modelName"
   * @returns 解析后的提供商和模型名称
   *
   * @example
   * parseModelId('openai:gpt-4o') // { provider: 'openai', modelName: 'gpt-4o' }
   * parseModelId('google:gemini-2.5-flash') // { provider: 'google', modelName: 'gemini-2.5-flash' }
   * parseModelId('qwen-max') // { provider: 'openai', modelName: 'qwen-max' }
   */
  parseModelId(modelId: string): ParsedModelId {
    if (modelId.includes(':')) {
      const [provider, ...rest] = modelId.split(':');
      const modelName = rest.join(':');

      if (provider === 'google') {
        return { provider: 'google', modelName };
      }
      if (provider === 'openai') {
        return { provider: 'openai', modelName };
      }
      // 未知提供商，作为模型名处理
      return { provider: 'openai', modelName: modelId };
    }

    // 无提供商前缀，默认使用 OpenAI 兼容 API
    return { provider: 'openai', modelName: modelId };
  }

  /**
   * 创建模型实例
   * @param modelId 模型 ID
   * @returns ChatOpenAI 或 ChatGoogleGenerativeAI 实例
   */
  createModel(modelId: string): ChatOpenAI | ChatGoogleGenerativeAI {
    const { provider, modelName } = this.parseModelId(modelId);

    console.log(
      `[ModelFactory] Creating model - Provider: ${provider}, Model: ${modelName}`,
    );

    if (provider === 'google') {
      return this.createGoogleModel(modelName);
    }

    return this.createOpenAIModel(modelName);
  }

  /**
   * 创建 OpenAI 兼容模型
   */
  private createOpenAIModel(modelName: string): ChatOpenAI {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const baseURL = this.config.get<string>('OPENAI_BASE_URL');
    const timeout = parseInt(
      this.config.get<string>('OPENAI_TIMEOUT') || '120000',
    );

    return new ChatOpenAI({
      model: modelName,
      apiKey,
      temperature: 0.7,
      streaming: true,
      timeout,
      configuration: { baseURL },
    });
  }

  /**
   * 创建 Google Gemini 模型
   */
  private createGoogleModel(modelName: string): ChatGoogleGenerativeAI {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');

    if (!apiKey) {
      throw new Error(
        '[ModelFactory] GOOGLE_API_KEY is required for Google Gemini models',
      );
    }

    return new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey,
      temperature: 0.7,
      streaming: true,
    });
  }
}
