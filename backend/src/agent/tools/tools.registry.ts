import {
    DynamicStructuredTool,
    StructuredToolInterface,
    tool,
} from '@langchain/core/tools';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
    getCustomToolConfigs,
    getLangChainToolConfigs,
    getMCPServersConfig,
    getToolConfigById,
    unifiedToolsConfig
} from './config';
import type { ToolType } from './types';

/**
 * MCP 连接超时时间（毫秒）
 */
const MCP_TIMEOUT = 15000;

/**
 * 增强版工具注册表
 *
 * 支持三种工具类型：
 * - custom: 自定义工具
 * - langchain: LangChain 预构建工具（动态导入）
 * - mcp: MCP 服务器工具
 *
 * 特性：
 * - 应用启动时预加载工具
 * - 工具缓存避免重复初始化
 * - MCP 连接超时处理
 */
@Injectable()
export class ToolsRegistry implements OnModuleInit {
  /** 启用的工具 ID 集合 */
  private enabledTools = new Set<string>();

  /** 自定义工具缓存 */
  private customToolsCache: Map<string, StructuredToolInterface> = new Map();

  /** LangChain 预构建工具缓存 */
  private langChainToolsCache: Map<string, StructuredToolInterface> = new Map();

  /** MCP 工具缓存 */
  private mcpToolsCache: DynamicStructuredTool[] | null = null;

  /** 所有工具缓存（合并后） */
  private allToolsCache: StructuredToolInterface[] | null = null;

  /** 预加载完成标志 */
  private preloaded = false;

  async onModuleInit() {
    await this.preloadTools();
    console.log(
      '[ToolsRegistry] Initialized with',
      this.enabledTools.size,
      'tools',
    );
  }

  /**
   * 预加载所有工具
   * 在应用启动时调用
   */
  async preloadTools(): Promise<void> {
    console.log('[ToolsRegistry] Starting tool preloading...');

    // 1. 加载自定义工具
    this.loadCustomTools();

    // 2. 预加载 LangChain 工具
    await this.preloadLangChainTools();

    // 3. 预加载 MCP 工具
    await this.preloadMCPTools();

    this.preloaded = true;
    console.log('[ToolsRegistry] Preloading complete');
  }

  /**
   * 加载自定义工具
   */
  private loadCustomTools(): void {
    const customConfigs = getCustomToolConfigs();
    console.log(
      `[ToolsRegistry] Loading ${customConfigs.length} custom tools...`,
    );

    for (const config of customConfigs) {
      if (config.schema && config.handler) {
        const toolInstance = tool(config.handler, {
          name: config.id,
          description: config.description,
          schema: config.schema,
        });
        this.customToolsCache.set(config.id, toolInstance);
        this.enabledTools.add(config.id);
        console.log(`[ToolsRegistry]   + ${config.name}`);
      }
    }
  }

  /**
   * 预加载 LangChain 工具
   */
  private async preloadLangChainTools(): Promise<void> {
    const langChainConfigs = getLangChainToolConfigs();

    if (langChainConfigs.length === 0) {
      console.log('[ToolsRegistry] No LangChain tools to preload');
      return;
    }

    console.log(
      `[ToolsRegistry] Preloading ${langChainConfigs.length} LangChain tools...`,
    );

    for (const config of langChainConfigs) {
      if (!config.langChainTool) continue;

      const { importPath, className, options } = config.langChainTool;

      try {
        console.log(
          `[ToolsRegistry]   Loading: ${config.name} from ${importPath}`,
        );

        // 动态导入模块
        const module = await import(/* webpackIgnore: true */ importPath);

        // 获取工具类
        let ToolClass: any;
        if (className) {
          ToolClass = module[className];
        } else {
          ToolClass =
            module.default ||
            Object.values(module).find((v: any) => typeof v === 'function');
        }

        if (!ToolClass) {
          console.error(
            `[ToolsRegistry]   Failed to find class: ${className} in ${importPath}`,
          );
          continue;
        }

        // 实例化工具
        const toolInstance = new ToolClass(options);
        this.langChainToolsCache.set(config.id, toolInstance);
        this.enabledTools.add(config.id);
        console.log(`[ToolsRegistry]   + ${config.name}`);
      } catch (error) {
        console.error(`[ToolsRegistry]   Failed to load: ${config.name}`, error);
      }
    }
  }

  /**
   * 预加载 MCP 工具
   */
  private async preloadMCPTools(): Promise<void> {
    if (this.mcpToolsCache !== null) {
      console.log('[ToolsRegistry] MCP tools already cached');
      return;
    }

    const mcpServersConfig = getMCPServersConfig();
    const serverNames = Object.keys(mcpServersConfig);

    if (serverNames.length === 0) {
      console.log('[ToolsRegistry] No MCP servers configured');
      return;
    }

    console.log(
      `[ToolsRegistry] Preloading ${serverNames.length} MCP servers...`,
    );

    try {
      const { MultiServerMCPClient } = await import('@langchain/mcp-adapters');

      // 构建符合 MultiServerMCPClient 格式的配置
      const serversForClient: Record<string, unknown> = {};
      for (const [name, config] of Object.entries(mcpServersConfig)) {
        serversForClient[name] = {
          command: config.command,
          args: config.args,
          transport: config.transport,
        };
      }

      const mcpClient = new MultiServerMCPClient({
        mcpServers: serversForClient as any,
      });

      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('MCP server connection timeout')),
          MCP_TIMEOUT,
        );
      });

      // 获取 MCP 工具，带超时处理
      const tools = await Promise.race([
        mcpClient.getTools(),
        timeoutPromise,
      ]);

      const mcpTools = tools as unknown as DynamicStructuredTool[];
      console.log(`[ToolsRegistry]   Loaded ${mcpTools.length} MCP tools`);
      mcpTools.forEach((t) => {
        console.log(`[ToolsRegistry]   + ${t.name}`);
        this.enabledTools.add(t.name);
      });

      this.mcpToolsCache = mcpTools;
    } catch (error) {
      console.error('[ToolsRegistry] MCP tools loading failed:', error);
      this.mcpToolsCache = []; // 失败时设为空数组
    }
  }

  /**
   * 使缓存失效
   */
  private invalidateCache(): void {
    this.allToolsCache = null;
  }

  /**
   * 获取所有启用的工具
   */
  getAllTools(): StructuredToolInterface[] {
    if (this.allToolsCache) return this.allToolsCache;

    const tools: StructuredToolInterface[] = [];

    // 添加自定义工具
    for (const [id, tool] of this.customToolsCache) {
      if (this.enabledTools.has(id)) {
        tools.push(tool);
      }
    }

    // 添加 LangChain 工具
    for (const [id, tool] of this.langChainToolsCache) {
      if (this.enabledTools.has(id)) {
        tools.push(tool);
      }
    }

    // 添加 MCP 工具
    if (this.mcpToolsCache) {
      tools.push(...this.mcpToolsCache);
    }

    this.allToolsCache = tools;
    return tools;
  }

  /**
   * 获取工具映射
   */
  getToolsMap(): Record<string, StructuredToolInterface> {
    const tools = this.getAllTools();
    const map: Record<string, StructuredToolInterface> = {};
    for (const t of tools) {
      map[t.name] = t;
    }
    return map;
  }

  /**
   * 获取单个工具
   */
  getTool(name: string): StructuredToolInterface {
    const customTool = this.customToolsCache.get(name);
    if (customTool && this.enabledTools.has(name)) return customTool;

    const langChainTool = this.langChainToolsCache.get(name);
    if (langChainTool && this.enabledTools.has(name)) return langChainTool;

    const mcpTool = this.mcpToolsCache?.find((t) => t.name === name);
    if (mcpTool) return mcpTool;

    throw new Error(`Tool "${name}" not found or not enabled`);
  }

  /**
   * 启用工具
   */
  enable(name: string): this {
    const config = getToolConfigById(name);
    if (config) {
      this.enabledTools.add(name);
      this.invalidateCache();
    }
    return this;
  }

  /**
   * 禁用工具
   */
  disable(name: string): this {
    this.enabledTools.delete(name);
    this.invalidateCache();
    return this;
  }

  /**
   * 检查工具是否启用
   */
  isEnabled(name: string): boolean {
    return this.enabledTools.has(name);
  }

  /**
   * 获取所有启用的工具名称
   */
  getEnabledToolNames(): string[] {
    return Array.from(this.enabledTools);
  }

  /**
   * 获取所有工具信息
   */
  getAllToolsInfo(): Array<{
    id: string;
    name: string;
    description: string;
    type: ToolType;
    enabled: boolean;
    icon?: string;
  }> {
    return unifiedToolsConfig.map((config) => ({
      id: config.id,
      name: config.name,
      description: config.description,
      type: config.type,
      enabled: this.enabledTools.has(config.id),
      icon: config.icon,
    }));
  }
}

// 向后兼容别名
export { ToolsRegistry as ToolsService };

