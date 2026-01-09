import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Document } from '@langchain/core/documents'
import { Injectable, Logger } from '@nestjs/common'
import { createId } from '@paralleldrive/cuid2'
import { Prisma } from '@prisma/client'
import { VectorStoreService } from './vector-store.service'

/**
 * 文档管理服务
 * 负责文档的持久化存储和向量索引
 */
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  /**
   * 添加单个文档
   */
  async addDocument(
    content: string,
    metadata: Record<string, unknown> = {},
    collection: string = 'default',
  ): Promise<string> {
    const id = createId()

    // 1. 保存到 Prisma（用于元数据管理）
    await this.prisma.document.create({
      data: {
        id,
        content,
        metadata: metadata as Prisma.InputJsonValue,
        collection,
      },
    })

    // 2. 添加到向量存储（用于相似性搜索）
    const doc = new Document({
      pageContent: content,
      metadata: { ...metadata, documentId: id },
    })

    await this.vectorStore.addDocuments([doc], collection, [id])

    this.logger.log({ event: 'document_added', id, collection })
    return id
  }

  /**
   * 批量添加文档
   */
  async addDocuments(
    docs: { content: string; metadata?: Record<string, unknown> }[],
    collection: string = 'default',
  ): Promise<string[]> {
    const ids = docs.map(() => createId())

    // 1. 批量保存到 Prisma
    await this.prisma.document.createMany({
      data: docs.map((doc, index) => ({
        id: ids[index],
        content: doc.content,
        metadata: (doc.metadata || {}) as Prisma.InputJsonValue,
        collection,
      })),
    })

    // 2. 批量添加到向量存储
    const langchainDocs = docs.map(
      (doc, index) =>
        new Document({
          pageContent: doc.content,
          metadata: { ...doc.metadata, documentId: ids[index] },
        }),
    )

    await this.vectorStore.addDocuments(langchainDocs, collection, ids)

    this.logger.log({
      event: 'documents_added_batch',
      count: docs.length,
      collection,
    })
    return ids
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: string): Promise<void> {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) {
      throw new Error(`Document ${id} not found`)
    }

    // 1. 从向量存储删除
    await this.vectorStore.deleteDocuments([id], doc.collection)

    // 2. 从 Prisma 删除
    await this.prisma.document.delete({ where: { id } })

    this.logger.log({ event: 'document_deleted', id })
  }

  /**
   * 获取文档
   */
  async getDocument(id: string) {
    return this.prisma.document.findUnique({ where: { id } })
  }

  /**
   * 列出指定 collection 的所有文档
   */
  async listDocuments(collection?: string) {
    return this.prisma.document.findMany({
      where: collection ? { collection } : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 获取文档统计信息
   */
  async getStats() {
    const total = await this.prisma.document.count()
    const byCollection = await this.prisma.document.groupBy({
      by: ['collection'],
      _count: true,
    })

    return {
      total,
      byCollection: byCollection.reduce(
        (acc, item) => {
          acc[item.collection] = item._count
          return acc
        },
        {} as Record<string, number>,
      ),
    }
  }
}
