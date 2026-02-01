import { Injectable, Logger } from '@nestjs/common'

import { PrismaService } from '@/infrastructure/database/prisma.service'
import {
  CompiledMemoryContext,
  DEFAULT_MEMORY_BLOCKS,
  MEMORY_BLOCK_CHAR_LIMIT,
  MemoryBlock,
  MemoryBlockCreateInput,
  MemoryBlockOperationResult,
} from '@/shared/schemas/memory-block.types'
import { MemoryBlockHistoryEntry } from '@/shared/schemas/memory-decision.types'

/**
 * 核心记忆块服务
 * 管理 Agent 可编辑的上下文内记忆
 * 参考 Letta 的 BlockManager
 */
@Injectable()
export class MemoryBlockService {
  private readonly logger = new Logger(MemoryBlockService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户的所有记忆块
   */
  async getBlocks(userId: string, agentId?: string): Promise<MemoryBlock[]> {
    const blocks = await this.prisma.memoryBlock.findMany({
      where: {
        userId,
        ...(agentId && { agentId }),
      },
      orderBy: { createdAt: 'asc' },
    })
    return blocks as MemoryBlock[]
  }

  /**
   * 获取单个记忆块
   */
  async getBlock(userId: string, label: string): Promise<MemoryBlock | null> {
    const block = await this.prisma.memoryBlock.findUnique({
      where: { userId_label: { userId, label } },
    })
    return block as MemoryBlock | null
  }

  /**
   * 创建或更新记忆块
   */
  async upsertBlock(input: MemoryBlockCreateInput): Promise<MemoryBlock> {
    const { userId, label, value = '', limit = MEMORY_BLOCK_CHAR_LIMIT, ...rest } = input

    // 验证字符限制
    if (value.length > limit) {
      throw new Error(`Block value exceeds character limit: ${value.length} > ${limit}`)
    }

    const block = await this.prisma.memoryBlock.upsert({
      where: { userId_label: { userId, label } },
      update: { value, limit, ...rest, updatedAt: new Date() },
      create: { userId, label, value, limit, readonly: false, ...rest },
    })

    this.logger.debug(`Upserted memory block: ${label} for user ${userId}`)
    return block as MemoryBlock
  }

  /**
   * 更新记忆块值
   */
  async updateBlockValue(
    userId: string,
    label: string,
    value: string,
  ): Promise<MemoryBlockOperationResult> {
    const block = await this.getBlock(userId, label)
    if (!block) {
      return { success: false, message: `Block '${label}' not found` }
    }

    if (block.readonly) {
      return { success: false, message: `Block '${label}' is read-only` }
    }

    if (value.length > block.limit) {
      return {
        success: false,
        message: `Value exceeds limit: ${value.length} > ${block.limit}`,
      }
    }

    const updated = await this.prisma.memoryBlock.update({
      where: { userId_label: { userId, label } },
      data: { value, updatedAt: new Date() },
    })

    return {
      success: true,
      message: `Block '${label}' updated successfully`,
      block: updated as MemoryBlock,
    }
  }

  /**
   * Append 模式：追加内容到记忆块
   * 参考 Letta 的 core_memory_append
   */
  async appendToBlock(
    userId: string,
    label: string,
    content: string,
  ): Promise<MemoryBlockOperationResult> {
    const block = await this.getBlock(userId, label)
    if (!block) {
      return { success: false, message: `Block '${label}' not found` }
    }

    if (block.readonly) {
      return { success: false, message: `Block '${label}' is read-only` }
    }

    const previousValue = block.value
    const newValue = block.value ? `${block.value}\n${content}` : content

    if (newValue.length > block.limit) {
      return {
        success: false,
        message: `Append would exceed limit: ${newValue.length} > ${block.limit}`,
      }
    }

    // 记录历史
    await this.recordBlockHistory(block.id, userId, label, 'APPEND', previousValue, newValue)

    return this.updateBlockValue(userId, label, newValue)
  }

  /**
   * Replace 模式：替换记忆块中的指定文本
   * 参考 Letta 的 core_memory_replace / memory_replace
   */
  async replaceInBlock(
    userId: string,
    label: string,
    oldContent: string,
    newContent: string,
  ): Promise<MemoryBlockOperationResult> {
    const block = await this.getBlock(userId, label)
    if (!block) {
      return { success: false, message: `Block '${label}' not found` }
    }

    if (block.readonly) {
      return { success: false, message: `Block '${label}' is read-only` }
    }

    if (!block.value.includes(oldContent)) {
      return {
        success: false,
        message: `Old content not found in block '${label}'`,
      }
    }

    // 检查是否有多个匹配
    const occurrences = block.value.split(oldContent).length - 1
    if (occurrences > 1) {
      return {
        success: false,
        message: `Multiple occurrences (${occurrences}) found. Please be more specific.`,
      }
    }

    const previousValue = block.value
    const newValue = block.value.replace(oldContent, newContent)

    if (newValue.length > block.limit) {
      return {
        success: false,
        message: `Replace would exceed limit: ${newValue.length} > ${block.limit}`,
      }
    }

    // 记录历史
    await this.recordBlockHistory(block.id, userId, label, 'REPLACE', previousValue, newValue)

    return this.updateBlockValue(userId, label, newValue)
  }

  /**
   * Rethink 模式：完全重写记忆块
   * 参考 Letta 的 memory_rethink
   */
  async rethinkBlock(
    userId: string,
    label: string,
    newMemory: string,
  ): Promise<MemoryBlockOperationResult> {
    const block = await this.getBlock(userId, label)

    // 如果块不存在，创建新块
    if (!block) {
      const created = await this.upsertBlock({
        userId,
        label,
        value: newMemory,
      })

      // 记录历史 (新创建)
      await this.recordBlockHistory(created.id, userId, label, 'RETHINK', '', newMemory)

      return {
        success: true,
        message: `Block '${label}' created with new memory`,
        block: created,
      }
    }

    if (block.readonly) {
      return { success: false, message: `Block '${label}' is read-only` }
    }

    const previousValue = block.value

    // 记录历史
    await this.recordBlockHistory(block.id, userId, label, 'RETHINK', previousValue, newMemory)

    return this.updateBlockValue(userId, label, newMemory)
  }

  /**
   * 记录记忆块变更历史
   */
  private async recordBlockHistory(
    blockId: string,
    userId: string,
    label: string,
    event: 'APPEND' | 'REPLACE' | 'RETHINK' | 'DELETE',
    previousValue: string,
    newValue: string,
  ): Promise<void> {
    try {
      await this.prisma.memoryBlockHistory.create({
        data: {
          blockId,
          userId,
          label,
          event,
          previousValue,
          newValue,
        },
      })
      this.logger.debug(`Recorded block history: ${label} ${event}`)
    } catch (error) {
      // 非关键操作，记录错误但不中断流程
      this.logger.warn(`Failed to record block history: ${error}`)
    }
  }

  /**
   * 获取记忆块变更历史
   */
  async getBlockHistory(
    userId: string,
    label: string,
    limit = 20,
  ): Promise<MemoryBlockHistoryEntry[]> {
    const block = await this.getBlock(userId, label)
    if (!block) {
      return []
    }

    const history = await this.prisma.memoryBlockHistory.findMany({
      where: { blockId: block.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return history as MemoryBlockHistoryEntry[]
  }

  /**
   * 回滚记忆块到之前的版本
   */
  async rollbackBlock(
    userId: string,
    label: string,
    historyId: string,
  ): Promise<MemoryBlockOperationResult> {
    const block = await this.getBlock(userId, label)
    if (!block) {
      return { success: false, message: `Block '${label}' not found` }
    }

    if (block.readonly) {
      return { success: false, message: `Block '${label}' is read-only` }
    }

    // 获取指定历史记录
    const historyEntry = await this.prisma.memoryBlockHistory.findUnique({
      where: { id: historyId },
    })

    if (!historyEntry || historyEntry.blockId !== block.id) {
      return { success: false, message: `History entry not found for block '${label}'` }
    }

    const previousValue = block.value
    const newValue = historyEntry.previousValue

    // 记录回滚操作
    await this.recordBlockHistory(block.id, userId, label, 'RETHINK', previousValue, newValue)

    return this.updateBlockValue(userId, label, newValue)
  }

  /**
   * 初始化默认记忆块
   */
  async initializeDefaultBlocks(userId: string): Promise<MemoryBlock[]> {
    const blocks: MemoryBlock[] = []

    for (const config of DEFAULT_MEMORY_BLOCKS) {
      const existing = await this.getBlock(userId, config.label)
      if (!existing) {
        const block = await this.upsertBlock({
          userId,
          label: config.label,
          value: config.defaultValue,
          description: config.description,
        })
        blocks.push(block)
      } else {
        blocks.push(existing)
      }
    }

    return blocks
  }

  /**
   * 编译记忆块为 System Prompt 格式
   * 参考 Letta 的 Memory.compile()
   */
  compileMemoryPrompt(blocks: MemoryBlock[]): CompiledMemoryContext {
    if (blocks.length === 0) {
      return { prompt: '', totalChars: 0, blocks: [] }
    }

    const lines: string[] = []
    lines.push('<memory_blocks>')
    lines.push('The following memory blocks are currently engaged in your core memory unit:\n')

    const blockMeta: CompiledMemoryContext['blocks'] = []

    for (const block of blocks) {
      const label = block.label
      const value = block.value || ''
      const desc = block.description || ''
      const charsUsed = value.length

      lines.push(`<${label}>`)
      if (desc) {
        lines.push('<description>')
        lines.push(desc)
        lines.push('</description>')
      }
      lines.push('<metadata>')
      if (block.readonly) {
        lines.push('- read_only=true')
      }
      lines.push(`- chars_current=${charsUsed}`)
      lines.push(`- chars_limit=${block.limit}`)
      lines.push('</metadata>')
      lines.push('<value>')
      lines.push(value)
      lines.push('</value>')
      lines.push(`</${label}>`)
      lines.push('')

      blockMeta.push({
        label,
        chars: charsUsed,
        limit: block.limit,
        readonly: block.readonly,
      })
    }

    lines.push('</memory_blocks>')

    const prompt = lines.join('\n')
    return {
      prompt,
      totalChars: prompt.length,
      blocks: blockMeta,
    }
  }

  /**
   * 删除记忆块
   */
  async deleteBlock(userId: string, label: string): Promise<boolean> {
    const block = await this.getBlock(userId, label)
    if (block) {
      // 记录删除历史
      await this.recordBlockHistory(block.id, userId, label, 'DELETE', block.value, '')
    }

    try {
      await this.prisma.memoryBlock.delete({
        where: { userId_label: { userId, label } },
      })
      return true
    } catch {
      return false
    }
  }
}
