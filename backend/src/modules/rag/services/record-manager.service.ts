import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'

/**
 * RecordManagerService
 * 跟踪已索引的文档，避免重复生成 embedding
 */
@Injectable()
export class RecordManagerService {
  private readonly logger = new Logger(RecordManagerService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 计算内容的 hash
   */
  private computeHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * 检查文档是否已存在（通过 sourceId + collection）
   * 如果存在且内容未变，返回 true
   */
  async exists(
    sourceId: string,
    content: string,
    collection: string = 'default',
  ): Promise<boolean> {
    const contentHash = this.computeHash(content)

    const record = await this.prisma.indexedRecord.findUnique({
      where: {
        sourceId_collection: { sourceId, collection },
      },
    })

    if (!record) {
      return false
    }

    // 内容未变化
    return record.contentHash === contentHash
  }

  /**
   * 记录新索引的文档
   */
  async track(sourceId: string, content: string, collection: string = 'default') {
    const contentHash = this.computeHash(content)

    await this.prisma.indexedRecord.upsert({
      where: {
        sourceId_collection: { sourceId, collection },
      },
      update: {
        contentHash,
        indexedAt: new Date(),
      },
      create: {
        sourceId,
        contentHash,
        collection,
        indexedAt: new Date(),
      },
    })

    this.logger.debug({
      event: 'document_tracked',
      sourceId,
      collection,
      contentHash,
    })
  }

  /**
   * 批量检查哪些文档需要索引
   * 返回需要索引的 sourceIds
   */
  async filterNeedsIndexing(
    documents: Array<{ sourceId: string; content: string }>,
    collection: string = 'default',
  ): Promise<string[]> {
    // 获取所有已存在的记录
    const sourceIds = documents.map((d) => d.sourceId)
    const existingRecords = await this.prisma.indexedRecord.findMany({
      where: {
        sourceId: { in: sourceIds },
        collection,
      },
      select: { sourceId: true, contentHash: true },
    })

    const existingMap = new Map(existingRecords.map((r) => [r.sourceId, r.contentHash]))

    // 过滤出需要索引的文档
    return documents
      .filter((doc) => {
        const existingHash = existingMap.get(doc.sourceId)
        if (!existingHash) return true // 新文档
        const currentHash = this.computeHash(doc.content)
        return existingHash !== currentHash // 内容变化
      })
      .map((d) => d.sourceId)
  }

  /**
   * 清理不再存在的记录
   */
  async cleanup(currentSourceIds: string[], collection: string = 'default') {
    const result = await this.prisma.indexedRecord.deleteMany({
      where: {
        collection,
        sourceId: { notIn: currentSourceIds },
      },
    })

    this.logger.log({
      event: 'cleanup_completed',
      collection,
      deletedCount: result.count,
    })

    return result.count
  }

  /**
   * 获取集合的索引统计
   */
  async getStats(collection: string = 'default') {
    const [count, latest] = await Promise.all([
      this.prisma.indexedRecord.count({ where: { collection } }),
      this.prisma.indexedRecord.findFirst({
        where: { collection },
        orderBy: { indexedAt: 'desc' },
        select: { indexedAt: true },
      }),
    ])

    return {
      collection,
      documentCount: count,
      lastIndexedAt: latest?.indexedAt,
    }
  }
}
