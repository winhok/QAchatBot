import { DynamicStructuredTool } from '@langchain/core/tools'
import { Injectable, Logger } from '@nestjs/common'
import { z } from 'zod'

import { MemoryBlockService } from '@/infrastructure/memory/memory-block.service'
import { MemoryBlockOperationResult } from '@/shared/schemas/memory-block.types'

// 定义输入类型以避免 any
interface AppendInput {
  label: string
  content: string
}

interface ReplaceInput {
  label: string
  old_content: string
  new_content: string
}

interface RethinkInput {
  label: string
  new_memory: string
}

interface SearchInput {
  label: string
  query: string
}

interface HistoryInput {
  label: string
  limit?: number
}

/**
 * Core Memory 工具提供者
 * 参考 Letta 的 base.py 中的 core_memory_append / memory_replace / memory_rethink
 * 增强：新增 search / list / history 工具
 */
@Injectable()
export class CoreMemoryToolProvider {
  private readonly logger = new Logger(CoreMemoryToolProvider.name)

  constructor(private readonly memoryBlockService: MemoryBlockService) {}

  /**
   * 获取所有 Core Memory 工具
   */
  getTools(userId: string): DynamicStructuredTool[] {
    return [
      this.createAppendTool(userId),
      this.createReplaceTool(userId),
      this.createRethinkTool(userId),
      this.createSearchTool(userId),
      this.createListTool(userId),
      this.createHistoryTool(userId),
    ]
  }

  /**
   * core_memory_append: 向记忆块追加内容
   */
  private createAppendTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'core_memory_append',
      description: `Append content to a core memory block. Use this to add new information without removing existing content.
Available blocks: 'persona' (about the assistant), 'human' (about the user).`,
      schema: z.object({
        label: z.string().describe("Memory block label, e.g. 'persona' or 'human'"),
        content: z.string().describe('Content to append. All unicode including emojis supported.'),
      }),
      func: async (input: AppendInput): Promise<string> => {
        const { label, content } = input
        this.logger.debug(`core_memory_append: ${label} += ${content.slice(0, 50)}...`)
        const result = await this.memoryBlockService.appendToBlock(userId, label, content)
        return this.formatResult(result, 'append')
      },
    })
  }

  /**
   * core_memory_replace: 替换记忆块中的指定文本
   */
  private createReplaceTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'core_memory_replace',
      description: `Replace specific text in a core memory block. To delete memory, use empty string for new_content.
The old_content must match exactly. Use this for precise edits.`,
      schema: z.object({
        label: z.string().describe("Memory block label, e.g. 'persona' or 'human'"),
        old_content: z.string().describe('Exact text to replace. Must match verbatim.'),
        new_content: z.string().describe('New text to insert. Use empty string to delete.'),
      }),
      func: async (input: ReplaceInput): Promise<string> => {
        const { label, old_content, new_content } = input
        this.logger.debug(`core_memory_replace: ${label}: "${old_content}" -> "${new_content}"`)
        const result = await this.memoryBlockService.replaceInBlock(
          userId,
          label,
          old_content,
          new_content,
        )
        return this.formatResult(result, 'replace')
      },
    })
  }

  /**
   * memory_rethink: 完全重写记忆块
   */
  private createRethinkTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'memory_rethink',
      description: `Completely rewrite a memory block. Use this for major reorganization or when the block needs significant changes.
Do NOT use for small edits - use core_memory_replace instead.`,
      schema: z.object({
        label: z.string().describe("Memory block label, e.g. 'persona' or 'human'"),
        new_memory: z.string().describe('Complete new content for the memory block.'),
      }),
      func: async (input: RethinkInput): Promise<string> => {
        const { label, new_memory } = input
        this.logger.debug(`memory_rethink: ${label} = ${new_memory.slice(0, 50)}...`)
        const result = await this.memoryBlockService.rethinkBlock(userId, label, new_memory)
        return this.formatResult(result, 'rethink')
      },
    })
  }

  /**
   * core_memory_search: 在记忆块内搜索内容
   */
  private createSearchTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'core_memory_search',
      description: `Search for content within a core memory block. Returns matching lines containing the query.
Use this to find specific information without retrieving the entire block.`,
      schema: z.object({
        label: z.string().describe("Memory block label to search in, e.g. 'human'"),
        query: z.string().describe('Text to search for (case-insensitive).'),
      }),
      func: async (input: SearchInput): Promise<string> => {
        const { label, query } = input
        this.logger.debug(`core_memory_search: ${label} for "${query}"`)

        const block = await this.memoryBlockService.getBlock(userId, label)
        if (!block) {
          return `Block '${label}' not found.`
        }

        if (!block.value) {
          return `Block '${label}' is empty.`
        }

        // 按行搜索
        const lines = block.value.split('\n')
        const matches = lines.filter((line) => line.toLowerCase().includes(query.toLowerCase()))

        if (matches.length === 0) {
          return `No matches found for "${query}" in block '${label}'.`
        }

        return `Found ${matches.length} matches in '${label}':\n${matches.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
      },
    })
  }

  /**
   * core_memory_list: 列出所有可用的记忆块
   */
  private createListTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'core_memory_list',
      description: `List all available core memory blocks. Shows block names, character usage, and whether they are editable.`,
      schema: z.object({}),
      func: async (): Promise<string> => {
        this.logger.debug(`core_memory_list for user ${userId}`)

        const blocks = await this.memoryBlockService.getBlocks(userId)

        if (blocks.length === 0) {
          return 'No core memory blocks found.'
        }

        const formatted = blocks.map((b) => {
          const usage = `${b.value.length}/${b.limit} chars`
          const status = b.readonly ? '[read-only]' : '[editable]'
          const preview = b.value.slice(0, 50).replace(/\n/g, ' ')
          return `- ${b.label} ${status} (${usage}): "${preview}${b.value.length > 50 ? '...' : ''}"`
        })

        return `Core memory blocks:\n${formatted.join('\n')}`
      },
    })
  }

  /**
   * core_memory_history: 查看记忆块变更历史
   */
  private createHistoryTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'core_memory_history',
      description: `View the change history of a core memory block. Shows recent edits, appends, and rewrites.`,
      schema: z.object({
        label: z.string().describe("Memory block label, e.g. 'human'"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('Number of history entries (default: 5)'),
      }),
      func: async (input: HistoryInput): Promise<string> => {
        const { label, limit } = input
        this.logger.debug(`core_memory_history: ${label}`)

        const history = await this.memoryBlockService.getBlockHistory(userId, label, limit ?? 5)

        if (history.length === 0) {
          return `No history found for block '${label}'.`
        }

        const formatted = history.map((h, i) => {
          const date = new Date(h.createdAt).toLocaleString()
          const preview = h.newValue.slice(0, 50).replace(/\n/g, ' ')
          return `${i + 1}. [${date}] ${h.event}: "${preview}${h.newValue.length > 50 ? '...' : ''}"`
        })

        return `History for '${label}' (${history.length} entries):\n${formatted.join('\n')}`
      },
    })
  }

  /**
   * 格式化工具执行结果
   */
  private formatResult(result: MemoryBlockOperationResult, operation: string): string {
    if (result.success) {
      return `Memory ${operation} successful. The core memory block has been updated and is now active in your context.`
    }
    return `Memory ${operation} failed: ${result.message}`
  }
}
