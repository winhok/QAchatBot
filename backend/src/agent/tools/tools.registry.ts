import { Injectable, OnModuleInit } from '@nestjs/common';
import { StructuredToolInterface, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { currentTimeTool, calculatorTool, readFileTool } from './builtin';

/**
 * 工具定义接口
 */
export interface ToolDefinition<T = Record<string, unknown>> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  handler: (params: T) => Promise<string> | string;
}

/**
 * 工具配置接口（内部使用）
 */
export interface ToolConfig<T = Record<string, unknown>> {
  name: string;
  description: string;
  enabled: boolean;
  schema: z.ZodSchema;
  handler: (params: T) => Promise<string> | string;
  options?: Record<string, unknown>;
}

type ToolHandler<T> = (params: T) => Promise<string> | string;

interface AddToolOptions<T> {
  description: string;
  schema: z.ZodSchema<T>;
  handler: ToolHandler<T>;
  enabled?: boolean;
  options?: Record<string, unknown>;
}

@Injectable()
export class ToolsRegistry implements OnModuleInit {
  private toolsConfig: Record<string, ToolConfig> = {};
  private enabledTools = new Set<string>();
  private toolsCache: StructuredToolInterface[] | null = null;
  private toolsMapCache: Record<string, StructuredToolInterface> | null = null;

  onModuleInit() {
    this.registerBuiltinTools();
    console.log(
      '[ToolsRegistry] Initialized with',
      this.enabledTools.size,
      'tools',
    );
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools() {
    this.register(currentTimeTool);
    this.register(calculatorTool);
    this.register(readFileTool);
  }

  /**
   * 注册工具（从 ToolDefinition）
   */
  register<T = Record<string, unknown>>(def: ToolDefinition<T>) {
    return this.add(def.name, {
      description: def.description,
      schema: def.schema,
      handler: def.handler,
    } as AddToolOptions<T>);
  }

  /**
   * 使缓存失效
   */
  private invalidateCache() {
    this.toolsCache = null;
    this.toolsMapCache = null;
  }

  /**
   * 从配置创建工具实例
   */
  private createToolFromConfig(config: ToolConfig): StructuredToolInterface {
    return tool(config.handler, {
      name: config.name,
      description: config.description,
      schema: config.schema,
    });
  }

  /**
   * 添加工具
   */
  add<T = Record<string, unknown>>(name: string, opts: AddToolOptions<T>) {
    const fullConfig: ToolConfig = {
      name,
      description: opts.description,
      schema: opts.schema,
      handler: opts.handler as ToolHandler<Record<string, unknown>>,
      enabled: opts.enabled ?? true,
      options: opts.options,
    };

    this.toolsConfig[name] = fullConfig;
    if (fullConfig.enabled) {
      this.enabledTools.add(name);
    }
    this.invalidateCache();
    return this;
  }

  /**
   * 移除工具
   */
  remove(name: string) {
    delete this.toolsConfig[name];
    this.enabledTools.delete(name);
    this.invalidateCache();
    return this;
  }

  /**
   * 禁用工具
   */
  disable(name: string) {
    if (this.toolsConfig[name]) {
      this.toolsConfig[name].enabled = false;
      this.enabledTools.delete(name);
      this.invalidateCache();
    }
    return this;
  }

  /**
   * 启用工具
   */
  enable(name: string) {
    if (this.toolsConfig[name]) {
      this.toolsConfig[name].enabled = true;
      this.enabledTools.add(name);
      this.invalidateCache();
    }
    return this;
  }

  /**
   * 获取所有启用的工具
   */
  getAllTools(): StructuredToolInterface[] {
    if (this.toolsCache) return this.toolsCache;

    this.toolsCache = Array.from(this.enabledTools)
      .map((name) => this.toolsConfig[name])
      .filter((config) => config && config.enabled)
      .map((config) => this.createToolFromConfig(config));

    return this.toolsCache;
  }

  /**
   * 获取工具映射
   */
  getToolsMap(): Record<string, StructuredToolInterface> {
    if (this.toolsMapCache) return this.toolsMapCache;

    this.toolsMapCache = {};
    for (const name of this.enabledTools) {
      const config = this.toolsConfig[name];
      if (config && config.enabled) {
        this.toolsMapCache[name] = this.createToolFromConfig(config);
      }
    }
    return this.toolsMapCache;
  }

  /**
   * 获取单个工具
   */
  getTool(name: string): StructuredToolInterface {
    const map = this.getToolsMap();
    const t = map[name];
    if (!t) throw new Error(`Tool "${name}" not found or not enabled`);
    return t;
  }

  /**
   * 检查工具是否启用
   */
  isEnabled(name: string): boolean {
    return (
      this.enabledTools.has(name) && this.toolsConfig[name]?.enabled === true
    );
  }

  /**
   * 获取所有启用的工具名称
   */
  getEnabledToolNames(): string[] {
    return Array.from(this.enabledTools);
  }

  /**
   * 获取工具信息
   */
  getToolInfo(name: string) {
    const config = this.toolsConfig[name];
    if (!config) return null;
    return {
      name: config.name,
      description: config.description,
      enabled: config.enabled,
      options: config.options,
    };
  }

  /**
   * 获取所有工具信息
   */
  getAllToolsInfo() {
    return Object.values(this.toolsConfig).map((config) => ({
      name: config.name,
      description: config.description,
      enabled: config.enabled,
      options: config.options,
    }));
  }
}

// 向后兼容别名
export { ToolsRegistry as ToolsService };
