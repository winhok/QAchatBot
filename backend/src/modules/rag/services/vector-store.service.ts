import { DistanceStrategy, PGVectorStore } from '@langchain/community/vectorstores/pgvector'
import { Document } from '@langchain/core/documents'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import * as crypto from 'crypto'
import { Pool } from 'pg'

import { getDatabaseUrl } from '@/config/database-url'

import { EmbeddingsService } from './embeddings.service'

/**
 * PGVector 向量存储配置
 */
interface VectorStoreConfig {
  tableName: string
  collectionName: string
  collectionTableName: string
  columns: {
    idColumnName: string
    vectorColumnName: string
    contentColumnName: string
    metadataColumnName: string
  }
  distanceStrategy: DistanceStrategy
}

const DEFAULT_CONFIG: VectorStoreConfig = {
  tableName: 'langchain_embeddings',
  collectionName: 'default',
  collectionTableName: 'langchain_collections',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: 'cosine',
}

/**
 * Upsert 结果
 */
export interface UpsertResult {
  id: string
  action: 'created' | 'updated' | 'unchanged'
  hash: string
}

/**
 * PgVector 向量存储服务
 * 使用 @langchain/community 的 PGVectorStore 实现向量存储和检索
 */
@Injectable()
export class VectorStoreService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool
  private vectorStores: Map<string, PGVectorStore> = new Map()

  private readonly logger = new Logger(VectorStoreService.name)

  constructor(private readonly embeddingsService: EmbeddingsService) {}

  async onModuleInit() {
    const connectionString: string = getDatabaseUrl()
    this.pool = new Pool({ connectionString })

    // 初始化默认 collection 的向量存储
    await this.getOrCreateVectorStore('default')
    this.logger.log({ event: 'vector_store', status: 'initialized' })
  }

  async onModuleDestroy() {
    // 关闭所有向量存储连接
    for (const [name, store] of this.vectorStores) {
      try {
        await store.end()
        this.logger.debug({ event: 'vector_store_closed', collection: name })
      } catch (error: unknown) {
        this.logger.error({ event: 'vector_store_close_error', error })
      }
    }
    await this.pool.end()
  }

  /**
   * 获取或创建指定 collection 的向量存储
   */
  async getOrCreateVectorStore(collectionName: string): Promise<PGVectorStore> {
    if (this.vectorStores.has(collectionName)) {
      return this.vectorStores.get(collectionName)!
    }

    const config = {
      ...DEFAULT_CONFIG,
      collectionName,
      pool: this.pool,
    }

    const vectorStore = await PGVectorStore.initialize(
      this.embeddingsService.getEmbeddings(),
      config,
    )

    this.vectorStores.set(collectionName, vectorStore)
    this.logger.log({
      event: 'vector_store_created',
      collection: collectionName,
    })

    return vectorStore
  }

  /**
   * 计算内容的 MD5 哈希
   */
  private computeHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * 添加文档到向量存储
   */
  async addDocuments(
    docs: Document[],
    collection: string = 'default',
    ids?: string[],
  ): Promise<void> {
    const vectorStore = await this.getOrCreateVectorStore(collection)

    // 为每个文档添加 hash
    const docsWithHash = docs.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        hash: this.computeHash(doc.pageContent),
      },
    }))

    await vectorStore.addDocuments(docsWithHash, { ids })
    this.logger.log({
      event: 'documents_added',
      collection,
      count: docs.length,
    })
  }

  /**
   * Upsert 文档：基于 hash 去重
   * 如果相同 hash 已存在则更新，否则插入新文档
   */
  async upsertDocument(
    doc: Document,
    collection: string = 'default',
    id?: string,
  ): Promise<UpsertResult> {
    const hash = this.computeHash(doc.pageContent)

    // 查找是否存在相同 hash 的文档
    const existing = await this.findByMetadata({ hash }, collection, 1)

    if (existing.length > 0) {
      const existingDoc = existing[0]
      const existingId = existingDoc.metadata?.id as string

      // 如果内容相同 (hash 匹配)，无需更新
      if (existingDoc.metadata?.hash === hash) {
        this.logger.debug({ event: 'document_unchanged', hash })
        return { id: existingId, action: 'unchanged', hash }
      }

      // 更新现有文档
      await this.updateDocument(existingId, doc, collection)
      return { id: existingId, action: 'updated', hash }
    }

    // 插入新文档
    const newId = id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const docWithMeta = {
      ...doc,
      metadata: { ...doc.metadata, id: newId, hash },
    }

    await this.addDocuments([docWithMeta], collection, [newId])
    return { id: newId, action: 'created', hash }
  }

  /**
   * 更新已存在的文档
   */
  async updateDocument(id: string, doc: Document, collection: string = 'default'): Promise<void> {
    // 先删除旧文档
    await this.deleteDocuments([id], collection)

    // 插入新文档 (保留原 ID)
    const hash = this.computeHash(doc.pageContent)
    const updatedDoc = {
      ...doc,
      metadata: {
        ...doc.metadata,
        id,
        hash,
        updatedAt: new Date().toISOString(),
      },
    }

    await this.addDocuments([updatedDoc], collection, [id])
    this.logger.log({ event: 'document_updated', id, collection })
  }

  /**
   * 从向量存储中删除文档
   */
  async deleteDocuments(ids: string[], collection: string = 'default'): Promise<void> {
    const vectorStore = await this.getOrCreateVectorStore(collection)
    await vectorStore.delete({ ids })
    this.logger.log({
      event: 'documents_deleted',
      collection,
      count: ids.length,
    })
  }

  /**
   * 按元数据过滤删除多个文档
   */
  async deleteByFilter(
    filter: Record<string, unknown>,
    collection: string = 'default',
  ): Promise<number> {
    // 先查找匹配的文档
    const docs = await this.findByMetadata(filter, collection, 1000)
    const ids = docs.map((d) => d.metadata?.id as string).filter((id) => id !== undefined)

    if (ids.length > 0) {
      await this.deleteDocuments(ids, collection)
    }

    return ids.length
  }

  /**
   * 按元数据查找文档
   */
  async findByMetadata(
    filter: Record<string, unknown>,
    collection: string = 'default',
    limit: number = 10,
  ): Promise<Document[]> {
    const vectorStore = await this.getOrCreateVectorStore(collection)

    // 使用空字符串搜索，然后按元数据过滤
    // 注意：这是一个简化实现，对于大数据集可能需要直接 SQL 查询
    try {
      const results = await vectorStore.similaritySearch('', limit * 10)

      // 按元数据过滤
      const filtered = results.filter((doc) => {
        return Object.entries(filter).every(([key, value]) => {
          return doc.metadata?.[key] === value
        })
      })

      return filtered.slice(0, limit)
    } catch (error) {
      this.logger.warn({
        event: 'find_by_metadata_error',
        filter,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * 相似性搜索
   */
  async similaritySearch(
    query: string,
    k: number = 5,
    collection: string = 'default',
  ): Promise<Document[]> {
    const vectorStore = await this.getOrCreateVectorStore(collection)
    return vectorStore.similaritySearch(query, k)
  }

  /**
   * 带分数的相似性搜索
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 5,
    collection: string = 'default',
  ): Promise<[Document, number][]> {
    const vectorStore = await this.getOrCreateVectorStore(collection)
    return vectorStore.similaritySearchWithScore(query, k)
  }

  /**
   * 带过滤条件的相似性搜索
   */
  async similaritySearchWithFilter(
    query: string,
    filter: Record<string, unknown>,
    k: number = 5,
    collection: string = 'default',
  ): Promise<[Document, number][]> {
    const vectorStore = await this.getOrCreateVectorStore(collection)
    const results = await vectorStore.similaritySearchWithScore(query, k * 3)

    // 按元数据过滤
    const filtered = results.filter(([doc]) => {
      return Object.entries(filter).every(([key, value]) => {
        return doc.metadata?.[key] === value
      })
    })

    return filtered.slice(0, k)
  }

  /**
   * 带相似度阈值的搜索
   */
  async similaritySearchWithThreshold(
    query: string,
    threshold: number = 0.7,
    k: number = 5,
    collection: string = 'default',
  ): Promise<[Document, number][]> {
    const results = await this.similaritySearchWithScore(query, k, collection)
    // 过滤低于阈值的结果 (注意：cosine 距离越小越相似)
    return results.filter(([, score]) => score >= threshold)
  }

  /**
   * 获取向量存储作为 Retriever
   */
  async asRetriever(collection: string = 'default', k: number = 5) {
    const vectorStore = await this.getOrCreateVectorStore(collection)
    return vectorStore.asRetriever({ k })
  }
}
