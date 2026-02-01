import { BaseMessage } from '@langchain/core/messages'
import { Injectable, Logger } from '@nestjs/common'

import { PrismaService } from '@/infrastructure/database/prisma.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { VectorStoreService } from '@/modules/rag/services/vector-store.service'
import {
  EpisodicMemory,
  EpisodicMemoryCreateInput,
  EpisodicMemorySearchResult,
} from '@/shared/schemas/episodic-memory.types'
import { MemorySchema, MergedMemory } from '@/shared/schemas/memory.types'

import { MemoryExtractionService } from './memory-extraction.service'
import { MemoryStoreService } from './memory-store.service'

/**
 * 三层记忆上下文
 */
export interface MemoryContext {
  /** 短期记忆：当前会话上下文 (Redis) */
  shortTerm: {
    sessionContext: Record<string, unknown> | null
    recentMessages: Record<string, unknown>[]
  }
  /** 中期记忆：相关历史记忆 (pgvector) */
  midTerm: EpisodicMemorySearchResult[]
  /** 长期记忆：用户档案 + 规则 (PostgreSQL) */
  longTerm: MergedMemory
}

/**
 * 统一记忆门面服务
 * 融合三层记忆：Redis (短期) + pgvector (中期) + PostgreSQL (长期)
 */
@Injectable()
export class UnifiedMemoryService {
  private readonly logger = new Logger(UnifiedMemoryService.name)
  private readonly MEMORY_COLLECTION = 'user_memories'
  private readonly DEFAULT_TOKEN_BUDGET = 2000

  constructor(
    private readonly redis: RedisService,
    private readonly memoryStore: MemoryStoreService,
    private readonly extraction: MemoryExtractionService,
    private readonly vectorStore: VectorStoreService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取会话所需的完整记忆上下文
   * 三层记忆融合
   */
  async getMemoryContext(sessionId: string, userId: string, query: string): Promise<MemoryContext> {
    const [shortTerm, midTerm, longTerm] = await Promise.all([
      this.getShortTermMemory(sessionId),
      this.getMidTermMemory(userId, query),
      this.getLongTermMemory(sessionId, userId),
    ])

    return { shortTerm, midTerm, longTerm }
  }

  /**
   * 获取短期记忆 (Redis)
   */
  private async getShortTermMemory(sessionId: string): Promise<MemoryContext['shortTerm']> {
    const [sessionContext, recentMessages] = await Promise.all([
      this.redis.getSessionContext(sessionId),
      this.redis.getRecentMessages(sessionId, 10),
    ])

    return { sessionContext, recentMessages }
  }

  /**
   * 获取中期记忆 (pgvector 语义搜索)
   */
  private async getMidTermMemory(
    userId: string,
    query: string,
    limit = 5,
  ): Promise<EpisodicMemorySearchResult[]> {
    try {
      // 使用向量搜索查找相关记忆
      const docs = await this.vectorStore.similaritySearchWithScore(
        query,
        limit,
        this.MEMORY_COLLECTION,
      )

      // 过滤出属于该用户的记忆并转换格式
      return docs
        .filter(([doc]) => doc.metadata?.userId === userId)
        .map(([doc, score]) => ({
          memory: {
            id: doc.metadata.id as string,
            userId: doc.metadata.userId as string,
            sessionId: doc.metadata.sessionId as string | undefined,
            type: doc.metadata.type as EpisodicMemory['type'],
            content: doc.pageContent,
            context: doc.metadata.context as string,
            importance: doc.metadata.importance as number,
            createdAt: new Date(doc.metadata.createdAt as string),
            expiresAt: doc.metadata.expiresAt
              ? new Date(doc.metadata.expiresAt as string)
              : undefined,
          },
          score,
        }))
    } catch (error) {
      this.logger.warn(`Failed to search mid-term memories: ${error}`)
      return []
    }
  }

  /**
   * 获取长期记忆 (PostgreSQL)
   */
  private async getLongTermMemory(sessionId: string, userId: string): Promise<MergedMemory> {
    const [mergedMemory, profile] = await Promise.all([
      this.memoryStore.getMergedMemoryForSession(sessionId, userId),
      this.extraction.getUserProfile(userId),
    ])

    return {
      ...mergedMemory,
      profile: profile || undefined,
    }
  }

  /**
   * 更新短期记忆上下文
   */
  async updateSessionContext(sessionId: string, context: Record<string, unknown>): Promise<void> {
    await this.redis.setSessionContext(sessionId, context)
  }

  /**
   * 推送消息到短期记忆
   */
  async pushMessage(sessionId: string, message: Record<string, unknown>): Promise<void> {
    await this.redis.pushMessage(sessionId, message)
  }

  /**
   * 对话结束后触发记忆更新
   * 带 Debounce 防抖
   */
  async scheduleMemoryUpdate(
    sessionId: string,
    userId: string,
    messages: BaseMessage[],
    schemas?: MemorySchema[],
  ): Promise<void> {
    // 1. 更新 Redis 短期缓存
    const recentMessages = messages.slice(-10).map((msg) => ({
      role: msg.getType(),
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      timestamp: new Date().toISOString(),
    }))

    await this.redis.setSessionContext(sessionId, {
      lastUpdate: new Date().toISOString(),
      messageCount: messages.length,
      lastMessages: recentMessages,
    })

    // 2. 防抖调度后台记忆提取任务
    await this.extraction.scheduleExtraction(sessionId, userId, messages, schemas)

    this.logger.debug(`Scheduled memory update for session ${sessionId}`)
  }

  /**
   * 添加情景记忆到向量存储
   * 支持完整 EpisodicMemory 或 CreateInput
   */
  async addEpisodicMemory(
    input: EpisodicMemory | EpisodicMemoryCreateInput,
  ): Promise<EpisodicMemory> {
    // 如果是 CreateInput，生成缺失字段
    const memory: EpisodicMemory = {
      id: 'id' in input ? input.id : `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: input.userId,
      sessionId: input.sessionId,
      type: input.type,
      content: input.content,
      context: input.context,
      importance: input.importance ?? 0.5,
      createdAt: 'createdAt' in input ? input.createdAt : new Date(),
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    }

    const doc = {
      pageContent: `${memory.context}\n\n${memory.content}`,
      metadata: {
        id: memory.id,
        userId: memory.userId,
        sessionId: memory.sessionId,
        type: memory.type,
        context: memory.context,
        importance: memory.importance,
        createdAt: memory.createdAt.toISOString(),
        expiresAt: memory.expiresAt?.toISOString(),
      },
    }

    await this.vectorStore.addDocuments([doc], this.MEMORY_COLLECTION, [memory.id])

    // 记录历史
    await this.recordMemoryHistory(memory.id, memory.userId, 'ADD', null, memory.content)

    this.logger.debug(`Added episodic memory ${memory.id} to vector store`)
    return memory
  }

  /**
   * 批量添加情景记忆
   */
  async addEpisodicMemories(memories: EpisodicMemory[]): Promise<void> {
    if (memories.length === 0) return

    const docs = memories.map((memory) => ({
      pageContent: `${memory.context}\n\n${memory.content}`,
      metadata: {
        id: memory.id,
        userId: memory.userId,
        sessionId: memory.sessionId,
        type: memory.type,
        context: memory.context,
        importance: memory.importance,
        createdAt: memory.createdAt.toISOString(),
        expiresAt: memory.expiresAt?.toISOString(),
      },
    }))

    const ids = memories.map((m) => m.id)
    await this.vectorStore.addDocuments(docs, this.MEMORY_COLLECTION, ids)
    this.logger.log(`Added ${memories.length} episodic memories to vector store`)
  }

  /**
   * 搜索情景记忆 (公开方法，供 archival_memory_search 工具使用)
   */
  async searchEpisodicMemory(
    userId: string,
    query: string,
    limit = 5,
  ): Promise<EpisodicMemorySearchResult[]> {
    return this.getMidTermMemory(userId, query, limit)
  }

  /**
   * 获取单个情景记忆
   */
  async getEpisodicMemory(memoryId: string, userId: string): Promise<EpisodicMemory | null> {
    try {
      const docs = await this.vectorStore.findByMetadata(
        { id: memoryId },
        this.MEMORY_COLLECTION,
        1,
      )

      if (docs.length === 0 || docs[0].metadata?.userId !== userId) {
        return null
      }

      const doc = docs[0]
      return {
        id: doc.metadata.id as string,
        userId: doc.metadata.userId as string,
        sessionId: doc.metadata.sessionId as string | undefined,
        type: doc.metadata.type as EpisodicMemory['type'],
        content: doc.pageContent.split('\n\n').slice(1).join('\n\n') || doc.pageContent,
        context: doc.metadata.context as string,
        importance: doc.metadata.importance as number,
        createdAt: new Date(doc.metadata.createdAt as string),
        expiresAt: doc.metadata.expiresAt ? new Date(doc.metadata.expiresAt as string) : undefined,
        metadata: doc.metadata as Record<string, unknown>,
      }
    } catch (error) {
      this.logger.error(`Failed to get episodic memory: ${error}`)
      return null
    }
  }

  /**
   * 更新情景记忆
   */
  async updateEpisodicMemory(
    memoryId: string,
    userId: string,
    newContent: string,
    newContext?: string,
  ): Promise<EpisodicMemory | null> {
    try {
      // 先获取现有记忆
      const existing = await this.getEpisodicMemory(memoryId, userId)
      if (!existing) {
        return null
      }

      // 记录历史
      await this.recordMemoryHistory(memoryId, userId, 'UPDATE', existing.content, newContent)

      // 更新记忆
      const updatedMemory: EpisodicMemory = {
        ...existing,
        content: newContent,
        context: newContext ?? existing.context,
      }

      const doc = {
        pageContent: `${updatedMemory.context}\n\n${updatedMemory.content}`,
        metadata: {
          id: updatedMemory.id,
          userId: updatedMemory.userId,
          sessionId: updatedMemory.sessionId,
          type: updatedMemory.type,
          context: updatedMemory.context,
          importance: updatedMemory.importance,
          createdAt: updatedMemory.createdAt.toISOString(),
          expiresAt: updatedMemory.expiresAt?.toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }

      await this.vectorStore.updateDocument(memoryId, doc, this.MEMORY_COLLECTION)
      this.logger.debug(`Updated episodic memory ${memoryId}`)
      return updatedMemory
    } catch (error) {
      this.logger.error(`Failed to update episodic memory: ${error}`)
      return null
    }
  }

  /**
   * 删除情景记忆
   */
  async deleteEpisodicMemory(memoryId: string, userId: string): Promise<boolean> {
    try {
      // 验证权限
      const existing = await this.getEpisodicMemory(memoryId, userId)
      if (!existing) {
        return false
      }

      // 记录历史
      await this.recordMemoryHistory(memoryId, userId, 'DELETE', existing.content, null)

      await this.vectorStore.deleteDocuments([memoryId], this.MEMORY_COLLECTION)
      this.logger.debug(`Deleted episodic memory ${memoryId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to delete episodic memory: ${error}`)
      return false
    }
  }

  /**
   * 记录记忆历史
   */
  private async recordMemoryHistory(
    memoryId: string,
    userId: string,
    event: 'ADD' | 'UPDATE' | 'DELETE',
    previousValue: string | null,
    newValue: string | null,
  ): Promise<void> {
    try {
      await this.prisma.memoryHistory.create({
        data: {
          memoryId,
          memoryType: 'episodic',
          userId,
          event,
          previousValue,
          newValue,
          actorId: 'system',
        },
      })
    } catch (error) {
      // 非关键操作，记录错误但不中断流程
      this.logger.warn(`Failed to record memory history: ${error}`)
    }
  }

  /**
   * 估算文本的 token 数量
   * 简化实现：约 4 个字符 = 1 token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * 格式化记忆上下文为系统提示
   * 支持 Token 预算控制
   */
  formatMemoryContext(context: MemoryContext, maxTokens?: number): string {
    const tokenBudget = maxTokens ?? this.DEFAULT_TOKEN_BUDGET
    const parts: string[] = []
    let currentTokens = 0

    // 优先级定义：用户档案 > 行为规则 > 相关历史 > 用户偏好
    const sections: Array<{ content: string; priority: number }> = []

    // 用户档案 (最高优先级)
    if (context.longTerm.profile) {
      const profile = context.longTerm.profile
      const profileLines: string[] = ['## 用户档案']
      if (profile.preferredName) profileLines.push(`- 称呼: ${profile.preferredName}`)
      if (profile.occupation) profileLines.push(`- 职业: ${profile.occupation}`)
      if (profile.location) profileLines.push(`- 位置: ${profile.location}`)
      if (profile.interests?.length) profileLines.push(`- 兴趣: ${profile.interests.join(', ')}`)
      if (profile.conversationPreferences?.length) {
        profileLines.push(`- 对话偏好: ${profile.conversationPreferences.join(', ')}`)
      }
      sections.push({ content: profileLines.join('\n'), priority: 100 })
    }

    // 行为规则 (高优先级)
    if (context.longTerm.rules.length > 0) {
      const rulesContent = ['## 行为规则', ...context.longTerm.rules.map((r) => `- ${r}`)].join(
        '\n',
      )
      sections.push({ content: rulesContent, priority: 90 })
    }

    // 相关历史记忆 (中优先级，按相关度排序)
    if (context.midTerm.length > 0) {
      const memoriesLines = ['## 相关历史记忆', '<memories>']
      for (const { memory, score } of context.midTerm) {
        memoriesLines.push(`- [相关度:${score.toFixed(2)}] ${memory.context}: ${memory.content}`)
      }
      memoriesLines.push('</memories>')
      sections.push({ content: memoriesLines.join('\n'), priority: 80 })
    }

    // 用户偏好 (较低优先级)
    if (Object.keys(context.longTerm.prefs).length > 0) {
      const prefsLines = ['## 用户偏好']
      for (const [key, value] of Object.entries(context.longTerm.prefs)) {
        prefsLines.push(`- ${key}: ${JSON.stringify(value)}`)
      }
      sections.push({ content: prefsLines.join('\n'), priority: 70 })
    }

    // 按优先级排序
    sections.sort((a, b) => b.priority - a.priority)

    // 按预算添加内容
    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section.content)
      if (currentTokens + sectionTokens <= tokenBudget) {
        parts.push(section.content)
        currentTokens += sectionTokens
      } else if (currentTokens < tokenBudget) {
        // 部分添加（截断）
        const remainingTokens = tokenBudget - currentTokens
        const remainingChars = remainingTokens * 4
        parts.push(section.content.slice(0, remainingChars) + '...')
        break
      }
    }

    return parts.join('\n\n')
  }

  /**
   * 清理过期记忆
   */
  async cleanupExpiredMemories(): Promise<{ episodic: number; shortTerm: number }> {
    // 清理过期的情景记忆
    const episodicResult = await this.prisma.episodicMemory.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })

    // 清理过期的长期记忆
    const shortTermResult = await this.memoryStore.cleanupExpired()

    this.logger.log(
      `Cleaned up ${episodicResult.count} episodic and ${shortTermResult} short-term memories`,
    )

    return {
      episodic: episodicResult.count,
      shortTerm: shortTermResult,
    }
  }
}
