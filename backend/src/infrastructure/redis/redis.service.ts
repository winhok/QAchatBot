import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

/**
 * 短期记忆 Redis 服务
 * 用于存储当前对话上下文、消息滑动窗口、Debounce 控制
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis
  private readonly logger = new Logger(RedisService.name)

  // TTL 配置 (秒)
  private readonly SHORT_TERM_TTL: number
  private readonly MAX_MESSAGES = 50 // 滑动窗口最大消息数

  constructor(private readonly config: ConfigService) {
    this.SHORT_TERM_TTL = this.config.get<number>('MEMORY_SHORT_TERM_TTL', 3600) // 默认 1 小时
  }

  onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', 'localhost')
    const port = this.config.get<number>('REDIS_PORT', 6379)
    const password = this.config.get<string>('REDIS_PASSWORD', '')

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    this.client.on('connect', () => {
      this.logger.log(`Connected to Redis at ${host}:${port}`)
    })

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`)
    })
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
      this.logger.log('Redis connection closed')
    }
  }

  // ========== 会话上下文 ==========

  private getSessionContextKey(sessionId: string): string {
    return `memory:session:${sessionId}:context`
  }

  /**
   * 设置会话上下文
   */
  async setSessionContext(
    sessionId: string,
    context: Record<string, unknown>,
    ttl?: number,
  ): Promise<void> {
    const key = this.getSessionContextKey(sessionId)
    const value = JSON.stringify(context)
    await this.client.setex(key, ttl || this.SHORT_TERM_TTL, value)
  }

  /**
   * 获取会话上下文
   */
  async getSessionContext(sessionId: string): Promise<Record<string, unknown> | null> {
    const key = this.getSessionContextKey(sessionId)
    const value = await this.client.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch {
      return null
    }
  }

  /**
   * 删除会话上下文
   */
  async deleteSessionContext(sessionId: string): Promise<void> {
    const key = this.getSessionContextKey(sessionId)
    await this.client.del(key)
  }

  // ========== 消息滑动窗口 ==========

  private getMessageWindowKey(sessionId: string): string {
    return `memory:session:${sessionId}:messages`
  }

  /**
   * 推送消息到滑动窗口
   */
  async pushMessage(sessionId: string, message: Record<string, unknown>): Promise<void> {
    const key = this.getMessageWindowKey(sessionId)
    const value = JSON.stringify(message)

    // 使用 pipeline 原子操作
    const pipeline = this.client.pipeline()
    pipeline.rpush(key, value)
    pipeline.ltrim(key, -this.MAX_MESSAGES, -1) // 保留最近 N 条
    pipeline.expire(key, this.SHORT_TERM_TTL)
    await pipeline.exec()
  }

  /**
   * 获取最近的消息
   */
  async getRecentMessages(sessionId: string, limit?: number): Promise<Record<string, unknown>[]> {
    const key = this.getMessageWindowKey(sessionId)
    const count = limit || this.MAX_MESSAGES
    const values = await this.client.lrange(key, -count, -1)

    return values.map((v): Record<string, unknown> => {
      try {
        return JSON.parse(v) as Record<string, unknown>
      } catch {
        return { content: v }
      }
    })
  }

  /**
   * 清空消息窗口
   */
  async clearMessages(sessionId: string): Promise<void> {
    const key = this.getMessageWindowKey(sessionId)
    await this.client.del(key)
  }

  // ========== Debounce 控制 ==========

  private getDebounceKey(sessionId: string): string {
    return `memory:debounce:${sessionId}`
  }

  /**
   * 设置 Debounce 锁
   * @returns true 如果成功设置（没有现有锁），false 如果已存在
   */
  async setDebounceKey(sessionId: string, taskId: string, ttlSeconds: number): Promise<boolean> {
    const key = this.getDebounceKey(sessionId)
    // NX: 只在 key 不存在时设置
    const result = await this.client.set(key, taskId, 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }

  /**
   * 获取当前的 Debounce 任务 ID
   */
  async getDebounceTaskId(sessionId: string): Promise<string | null> {
    const key = this.getDebounceKey(sessionId)
    return this.client.get(key)
  }

  /**
   * 取消 Debounce（删除锁）
   */
  async cancelDebounce(sessionId: string): Promise<void> {
    const key = this.getDebounceKey(sessionId)
    await this.client.del(key)
  }

  /**
   * 更新 Debounce 任务 ID（用于重新调度）
   */
  async updateDebounceKey(sessionId: string, taskId: string, ttlSeconds: number): Promise<void> {
    const key = this.getDebounceKey(sessionId)
    await this.client.setex(key, ttlSeconds, taskId)
  }

  // ========== 工具方法 ==========

  /**
   * 检查 Redis 连接状态
   */
  isConnected(): boolean {
    return this.client?.status === 'ready'
  }

  /**
   * 获取底层 Redis 客户端（用于高级操作）
   */
  getClient(): Redis {
    return this.client
  }
}
