import { PrismaService } from '@/infrastructure/database/prisma.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { EmbeddingsService } from '@/modules/rag/services/embeddings.service'
import { VectorStoreService } from '@/modules/rag/services/vector-store.service'
import { EpisodicMemory, EpisodicMemorySearchResult } from '@/shared/schemas/episodic-memory.types'
import { MemorySchema, MergedMemory } from '@/shared/schemas/memory.types'
import { BaseMessage } from '@langchain/core/messages'
import { Injectable, Logger } from '@nestjs/common'
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

  constructor(
    private readonly redis: RedisService,
    private readonly memoryStore: MemoryStoreService,
    private readonly extraction: MemoryExtractionService,
    private readonly vectorStore: VectorStoreService,
    private readonly embeddings: EmbeddingsService,
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
      role: msg._getType(),
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
   */
  async addEpisodicMemory(memory: EpisodicMemory): Promise<void> {
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
    this.logger.debug(`Added episodic memory ${memory.id} to vector store`)
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
   * 格式化记忆上下文为系统提示
   * 参考 memory-template 的 format_memories
   */
  formatMemoryContext(context: MemoryContext): string {
    const parts: string[] = []

    // 用户档案
    if (context.longTerm.profile) {
      const profile = context.longTerm.profile
      parts.push('## 用户档案')
      if (profile.preferredName) parts.push(`- 称呼: ${profile.preferredName}`)
      if (profile.occupation) parts.push(`- 职业: ${profile.occupation}`)
      if (profile.location) parts.push(`- 位置: ${profile.location}`)
      if (profile.interests?.length) parts.push(`- 兴趣: ${profile.interests.join(', ')}`)
      if (profile.conversationPreferences?.length) {
        parts.push(`- 对话偏好: ${profile.conversationPreferences.join(', ')}`)
      }
    }

    // 相关历史记忆
    if (context.midTerm.length > 0) {
      parts.push('\n## 相关历史记忆')
      parts.push('<memories>')
      for (const { memory, score } of context.midTerm) {
        parts.push(`- [相关度:${score.toFixed(2)}] ${memory.context}: ${memory.content}`)
      }
      parts.push('</memories>')
    }

    // 用户偏好和规则
    if (Object.keys(context.longTerm.prefs).length > 0) {
      parts.push('\n## 用户偏好')
      for (const [key, value] of Object.entries(context.longTerm.prefs)) {
        parts.push(`- ${key}: ${JSON.stringify(value)}`)
      }
    }

    if (context.longTerm.rules.length > 0) {
      parts.push('\n## 行为规则')
      for (const rule of context.longTerm.rules) {
        parts.push(`- ${rule}`)
      }
    }

    return parts.join('\n')
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
