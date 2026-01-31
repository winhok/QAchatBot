import { PrismaService } from '@/infrastructure/database/prisma.service'
import { MEMORY_EXTRACTION_QUEUE } from '@/infrastructure/redis/redis.module'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { EpisodicMemoryCreateInput } from '@/shared/schemas/episodic-memory.types'
import {
  DEFAULT_MEMORY_SCHEMAS,
  ExtractionJobData,
  MemorySchema,
  UserProfile,
} from '@/shared/schemas/memory.types'
import { BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bullmq'

/**
 * 记忆提取服务
 * 参考 memory-template 的 memory_graph，使用 LLM 从对话中自动提取记忆
 */
@Injectable()
export class MemoryExtractionService {
  private readonly logger = new Logger(MemoryExtractionService.name)
  private readonly model: ChatOpenAI
  private readonly debounceSeconds: number

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(MEMORY_EXTRACTION_QUEUE) private readonly extractionQueue: Queue,
  ) {
    this.model = new ChatOpenAI({
      model: config.get<string>('MEMORY_EXTRACTION_MODEL', 'gpt-4o-mini'),
      temperature: 0,
      apiKey: config.get('OPENAI_API_KEY'),
      configuration: { baseURL: config.get('OPENAI_BASE_URL') },
    })
    this.debounceSeconds = config.get<number>('MEMORY_DEBOUNCE_SECONDS', 3)
  }

  /**
   * 调度记忆提取任务（带 Debounce）
   * 参考 memory-template 的 schedule_memories 节点
   */
  async scheduleExtraction(
    sessionId: string,
    userId: string,
    messages: BaseMessage[],
    schemas?: MemorySchema[],
  ): Promise<void> {
    const jobId = `extract-${sessionId}-${Date.now()}`
    const effectiveSchemas = schemas || DEFAULT_MEMORY_SCHEMAS

    // 取消之前的 debounce 任务
    const existingTaskId = await this.redis.getDebounceTaskId(sessionId)
    if (existingTaskId) {
      try {
        const existingJob = await this.extractionQueue.getJob(existingTaskId)
        if (existingJob && (await existingJob.getState()) === 'delayed') {
          await existingJob.remove()
          this.logger.debug(`Cancelled previous extraction job: ${existingTaskId}`)
        }
      } catch (error) {
        this.logger.warn(`Failed to cancel previous job: ${error}`)
      }
    }

    // 转换消息格式
    const serializedMessages = messages.map((msg) => ({
      role: msg._getType(),
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }))

    // 添加延迟任务
    await this.extractionQueue.add(
      'extract',
      {
        userId,
        sessionId,
        messages: serializedMessages,
        schemas: effectiveSchemas,
      } as ExtractionJobData,
      {
        jobId,
        delay: this.debounceSeconds * 1000, // 延迟执行
        removeOnComplete: true,
      },
    )

    // 更新 debounce key
    await this.redis.updateDebounceKey(sessionId, jobId, this.debounceSeconds + 5)

    this.logger.log(`Scheduled extraction job ${jobId} with ${this.debounceSeconds}s delay`)
  }

  /**
   * 执行记忆提取
   * 处理 Patch 和 Insert 两种模式
   */
  async extractMemories(data: ExtractionJobData): Promise<void> {
    const { userId, sessionId, messages, schemas } = data

    if (messages.length === 0) {
      this.logger.warn('No messages to extract memories from')
      return
    }

    this.logger.log(`Extracting memories for user ${userId} from ${messages.length} messages`)

    // 并行处理所有 schema
    await Promise.allSettled(
      schemas.map((schema) => this.processSchema(userId, sessionId, messages, schema)),
    )

    // 清除 debounce key
    await this.redis.cancelDebounce(sessionId)
  }

  /**
   * 处理单个 schema 的记忆提取
   */
  private async processSchema(
    userId: string,
    sessionId: string,
    messages: Array<{ role: string; content: string }>,
    schema: MemorySchema,
  ): Promise<void> {
    try {
      if (schema.updateMode === 'patch') {
        await this.patchMemory(userId, messages, schema)
      } else {
        await this.insertMemory(userId, sessionId, messages, schema)
      }
    } catch (error) {
      this.logger.error(`Failed to process schema ${schema.name}: ${error}`)
    }
  }

  /**
   * Patch 模式：更新用户档案
   */
  private async patchMemory(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    schema: MemorySchema,
  ): Promise<void> {
    // 获取现有档案
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
    })

    const conversationText = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const systemPrompt = `You are a memory extraction assistant. Extract user information from the conversation and return a JSON object.

${schema.description}

${schema.systemPrompt || ''}

Current user profile:
${existing ? JSON.stringify(existing, null, 2) : 'No existing profile'}

Schema:
${JSON.stringify(schema.parameters, null, 2)}

Instructions:
- Only extract information that is explicitly mentioned or strongly implied
- Return a JSON object with only the fields that should be updated
- Use null for fields that should be cleared
- Preserve existing values if no new information is found
- Return an empty object {} if no updates are needed`

    const response = await this.model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: conversationText },
      {
        role: 'user',
        content:
          'Extract the user profile updates as a JSON object. Return only valid JSON, no explanation.',
      },
    ])

    try {
      const content =
        typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        this.logger.debug('No JSON found in response, skipping patch')
        return
      }

      const updates = JSON.parse(jsonMatch[0]) as Partial<UserProfile>

      if (Object.keys(updates).length === 0) {
        this.logger.debug('No updates extracted, skipping patch')
        return
      }

      // 构建更新数据
      const updateData: Record<string, unknown> = {}
      if (updates.preferredName !== undefined) updateData.preferredName = updates.preferredName
      if (updates.age !== undefined) updateData.age = updates.age
      if (updates.interests !== undefined) updateData.interests = updates.interests
      if (updates.occupation !== undefined) updateData.occupation = updates.occupation
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.conversationPreferences !== undefined)
        updateData.conversationPreferences = updates.conversationPreferences
      if (updates.relationships !== undefined) updateData.relationships = updates.relationships

      // Upsert 用户档案
      await this.prisma.userProfile.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData,
        },
      })

      this.logger.log(`Patched user profile for ${userId}:`, Object.keys(updateData))
    } catch (error) {
      this.logger.error(`Failed to parse patch response: ${error}`)
    }
  }

  /**
   * Insert 模式：插入事件记忆
   */
  private async insertMemory(
    userId: string,
    sessionId: string,
    messages: Array<{ role: string; content: string }>,
    schema: MemorySchema,
  ): Promise<void> {
    const conversationText = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const systemPrompt = `You are a memory extraction assistant. Extract notable memories from the conversation.

${schema.description}

${schema.systemPrompt || ''}

Schema:
${JSON.stringify(schema.parameters, null, 2)}

Instructions:
- Extract multiple memories if appropriate
- Each memory should have 'context' and 'content' fields
- Context describes when/where this memory is relevant
- Content is the actual information to remember
- Return a JSON array of memories
- Return an empty array [] if no notable memories`

    const response = await this.model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: conversationText },
      {
        role: 'user',
        content:
          'Extract notable memories as a JSON array. Return only valid JSON array, no explanation.',
      },
    ])

    try {
      const content =
        typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

      // 提取 JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        this.logger.debug('No JSON array found in response, skipping insert')
        return
      }

      const memories = JSON.parse(jsonMatch[0]) as Array<{ context: string; content: string }>

      if (memories.length === 0) {
        this.logger.debug('No memories extracted, skipping insert')
        return
      }

      // 批量插入记忆
      const createInputs: EpisodicMemoryCreateInput[] = memories.map((mem) => ({
        userId,
        sessionId,
        type: 'note' as const,
        content: mem.content,
        context: mem.context,
        importance: 0.5,
      }))

      await this.prisma.episodicMemory.createMany({
        data: createInputs.map((input) => ({
          userId: input.userId,
          sessionId: input.sessionId,
          type: input.type,
          content: input.content,
          context: input.context,
          importance: input.importance,
        })),
      })

      this.logger.log(`Inserted ${memories.length} episodic memories for ${userId}`)
    } catch (error) {
      this.logger.error(`Failed to parse insert response: ${error}`)
    }
  }

  /**
   * 获取用户档案
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!profile) return null

    return {
      preferredName: profile.preferredName ?? undefined,
      age: profile.age ?? undefined,
      interests: profile.interests,
      occupation: profile.occupation ?? undefined,
      location: profile.location ?? undefined,
      conversationPreferences: profile.conversationPreferences,
      relationships: profile.relationships as UserProfile['relationships'],
      lastUpdated: profile.updatedAt,
    }
  }
}
