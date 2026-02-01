import { DynamicStructuredTool } from '@langchain/core/tools'
import { Injectable, Logger } from '@nestjs/common'
import { z } from 'zod'

import { UnifiedMemoryService } from '@/infrastructure/memory/unified-memory.service'
import { EpisodicMemoryCreateInput } from '@/shared/schemas/episodic-memory.types'

/**
 * Archival Memory 工具提供者
 * 参考 Letta 的 archival_memory_insert / archival_memory_search
 * 增强：新增 update / delete / get 工具支持完整 CRUD
 */
@Injectable()
export class ArchivalMemoryToolProvider {
  private readonly logger = new Logger(ArchivalMemoryToolProvider.name)

  constructor(private readonly unifiedMemory: UnifiedMemoryService) {}

  /**
   * 获取所有 Archival Memory 工具
   */
  getTools(userId: string, sessionId: string): DynamicStructuredTool[] {
    return [
      this.createInsertTool(userId, sessionId),
      this.createSearchTool(userId),
      this.createUpdateTool(userId),
      this.createDeleteTool(userId),
      this.createGetTool(userId),
    ]
  }

  /**
   * archival_memory_insert: 向长期记忆存储信息
   */
  private createInsertTool(userId: string, sessionId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'archival_memory_insert',
      description: `Store information in long-term archival memory for later retrieval.

Use this to save:
- Important facts about the user
- Meeting notes, decisions, commitments
- Any information you want to remember across conversations

Best practices:
- Store self-contained facts or summaries, not conversational fragments
- Add descriptive tags for easier retrieval later`,
      schema: z.object({
        content: z
          .string()
          .describe('The information to store. Should be clear and self-contained.'),
        context: z.string().describe('Situation or condition where this memory is relevant.'),
        tags: z
          .array(z.string())
          .optional()
          .describe('Category tags for easier retrieval, e.g. ["meetings", "preferences"]'),
        importance: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe('Importance score 0-1, higher = more important'),
      }),
      func: async (args: {
        content: string
        context: string
        tags?: string[]
        importance?: number
      }): Promise<string> => {
        const { content, context, tags, importance } = args
        this.logger.debug(`archival_memory_insert: ${content.slice(0, 50)}...`)

        const input: EpisodicMemoryCreateInput = {
          userId,
          sessionId,
          type: 'note',
          content,
          context,
          importance: importance ?? 0.7,
          metadata: tags ? { tags } : undefined,
        }

        const memory = await this.unifiedMemory.addEpisodicMemory(input)

        return `Memory stored successfully with ID: ${memory.id}. Content: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`
      },
    })
  }

  /**
   * archival_memory_search: 语义搜索长期记忆
   */
  private createSearchTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'archival_memory_search',
      description: `Search archival memory using semantic similarity.

Use this when you need to recall:
- Information from past conversations
- Previously stored facts about the user
- Any knowledge you've saved with archival_memory_insert

Tips:
- Query by concept/meaning, not exact phrases
- Results are ranked by semantic relevance
- Each result includes a memory_id you can use with update/delete`,
      schema: z.object({
        query: z.string().describe('What you are looking for, described naturally.'),
        top_k: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('Maximum results to return (default: 5)'),
      }),
      func: async (args: { query: string; top_k?: number }): Promise<string> => {
        const { query, top_k } = args
        this.logger.debug(`archival_memory_search: "${query}"`)

        const results = await this.unifiedMemory.searchEpisodicMemory(userId, query, top_k ?? 5)

        if (results.length === 0) {
          return 'No results found in archival memory.'
        }

        const formatted = results
          .map((r, i) => {
            const dateStr = new Date(r.memory.createdAt).toLocaleDateString()
            return `${i + 1}. [ID: ${r.memory.id}] [${dateStr}] ${r.memory.content}\n   Context: ${r.memory.context}\n   Relevance: ${(r.score * 100).toFixed(0)}%`
          })
          .join('\n\n')

        return `Found ${results.length} results:\n\n${formatted}`
      },
    })
  }

  /**
   * archival_memory_update: 更新现有记忆
   */
  private createUpdateTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'archival_memory_update',
      description: `Update an existing memory in archival storage.

Use this when:
- Information has changed and needs correction
- You want to add details to an existing memory
- A previously stored fact is now outdated

You need the memory_id from a previous search result.`,
      schema: z.object({
        memory_id: z.string().describe('The ID of the memory to update (from search results).'),
        new_content: z.string().describe('The updated content to replace the old content.'),
        new_context: z
          .string()
          .optional()
          .describe('Updated context. If not provided, keeps the original.'),
      }),
      func: async (args: {
        memory_id: string
        new_content: string
        new_context?: string
      }): Promise<string> => {
        const { memory_id, new_content, new_context } = args
        this.logger.debug(`archival_memory_update: ${memory_id}`)

        try {
          const result = await this.unifiedMemory.updateEpisodicMemory(
            memory_id,
            userId,
            new_content,
            new_context,
          )

          if (!result) {
            return `Memory with ID ${memory_id} not found or access denied.`
          }

          return `Memory updated successfully. New content: "${new_content.slice(0, 100)}${new_content.length > 100 ? '...' : ''}"`
        } catch (error) {
          this.logger.error(`Failed to update memory: ${error}`)
          return `Failed to update memory: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    })
  }

  /**
   * archival_memory_delete: 删除记忆
   */
  private createDeleteTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'archival_memory_delete',
      description: `Delete a memory from archival storage.

Use this when:
- Information is no longer relevant
- A memory was stored by mistake
- User explicitly asks to forget something

Warning: This action cannot be undone.`,
      schema: z.object({
        memory_id: z.string().describe('The ID of the memory to delete (from search results).'),
        reason: z.string().optional().describe('Reason for deletion (for audit trail).'),
      }),
      func: async (args: { memory_id: string; reason?: string }): Promise<string> => {
        const { memory_id, reason } = args
        this.logger.debug(`archival_memory_delete: ${memory_id}, reason: ${reason}`)

        try {
          const deleted = await this.unifiedMemory.deleteEpisodicMemory(memory_id, userId)

          if (!deleted) {
            return `Memory with ID ${memory_id} not found or access denied.`
          }

          return `Memory deleted successfully.${reason ? ` Reason: ${reason}` : ''}`
        } catch (error) {
          this.logger.error(`Failed to delete memory: ${error}`)
          return `Failed to delete memory: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    })
  }

  /**
   * archival_memory_get: 获取特定记忆详情
   */
  private createGetTool(userId: string): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: 'archival_memory_get',
      description: `Get the full details of a specific memory by ID.

Use this when you need to see the complete content of a memory
that was returned in a search result.`,
      schema: z.object({
        memory_id: z.string().describe('The ID of the memory to retrieve.'),
      }),
      func: async (args: { memory_id: string }): Promise<string> => {
        const { memory_id } = args
        this.logger.debug(`archival_memory_get: ${memory_id}`)

        try {
          const memory = await this.unifiedMemory.getEpisodicMemory(memory_id, userId)

          if (!memory) {
            return `Memory with ID ${memory_id} not found or access denied.`
          }

          const dateStr = new Date(memory.createdAt).toLocaleString()
          const metadata = memory.metadata ? JSON.stringify(memory.metadata) : 'none'

          return `Memory Details:
ID: ${memory.id}
Type: ${memory.type}
Content: ${memory.content}
Context: ${memory.context}
Importance: ${(memory.importance * 100).toFixed(0)}%
Created: ${dateStr}
Metadata: ${metadata}`
        } catch (error) {
          this.logger.error(`Failed to get memory: ${error}`)
          return `Failed to retrieve memory: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      },
    })
  }
}
