import { MEMORY_EXTRACTION_QUEUE } from '@/infrastructure/redis/redis.module'
import { ExtractionJobData } from '@/shared/schemas/memory.types'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { MemoryExtractionService } from './memory-extraction.service'

/**
 * 记忆提取任务处理器
 * 后台异步处理 LLM 记忆提取
 */
@Processor(MEMORY_EXTRACTION_QUEUE)
export class MemoryExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(MemoryExtractionProcessor.name)

  constructor(private readonly extractionService: MemoryExtractionService) {
    super()
  }

  async process(job: Job<ExtractionJobData>): Promise<void> {
    this.logger.log(`Processing extraction job ${job.id} for user ${job.data.userId}`)

    try {
      await this.extractionService.extractMemories(job.data)
      this.logger.log(`Completed extraction job ${job.id}`)
    } catch (error) {
      this.logger.error(`Failed extraction job ${job.id}: ${error}`)
      throw error // 让 BullMQ 处理重试
    }
  }
}
