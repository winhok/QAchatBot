import {
    DistanceStrategy,
    PGVectorStore,
} from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Pool } from 'pg';
import { EmbeddingsService } from './embeddings.service';

/**
 * PGVector 向量存储配置
 */
interface VectorStoreConfig {
  tableName: string;
  collectionName: string;
  collectionTableName: string;
  columns: {
    idColumnName: string;
    vectorColumnName: string;
    contentColumnName: string;
    metadataColumnName: string;
  };
  distanceStrategy: DistanceStrategy;
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
};

/**
 * PgVector 向量存储服务
 * 使用 @langchain/community 的 PGVectorStore 实现向量存储和检索
 */
@Injectable()
export class VectorStoreService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private vectorStores: Map<string, PGVectorStore> = new Map();
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingsService: EmbeddingsService,
    @InjectPinoLogger(VectorStoreService.name)
    private readonly logger: PinoLogger,
  ) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    this.pool = new Pool({ connectionString });

    // 初始化默认 collection 的向量存储
    await this.getOrCreateVectorStore('default');
    this.initialized = true;
    this.logger.info({ event: 'vector_store', status: 'initialized' });
  }

  async onModuleDestroy() {
    // 关闭所有向量存储连接
    for (const [name, store] of this.vectorStores) {
      try {
        await store.end();
        this.logger.debug({ event: 'vector_store_closed', collection: name });
      } catch (error) {
        this.logger.error({ event: 'vector_store_close_error', error });
      }
    }
    await this.pool.end();
  }

  /**
   * 获取或创建指定 collection 的向量存储
   */
  async getOrCreateVectorStore(collectionName: string): Promise<PGVectorStore> {
    if (this.vectorStores.has(collectionName)) {
      return this.vectorStores.get(collectionName)!;
    }

    const config = {
      ...DEFAULT_CONFIG,
      collectionName,
      pool: this.pool,
    };

    const vectorStore = await PGVectorStore.initialize(
      this.embeddingsService.getEmbeddings(),
      config,
    );

    this.vectorStores.set(collectionName, vectorStore);
    this.logger.info({
      event: 'vector_store_created',
      collection: collectionName,
    });

    return vectorStore;
  }

  /**
   * 添加文档到向量存储
   */
  async addDocuments(
    docs: Document[],
    collection: string = 'default',
    ids?: string[],
  ): Promise<void> {
    const vectorStore = await this.getOrCreateVectorStore(collection);
    await vectorStore.addDocuments(docs, { ids });
    this.logger.info({
      event: 'documents_added',
      collection,
      count: docs.length,
    });
  }

  /**
   * 从向量存储中删除文档
   */
  async deleteDocuments(
    ids: string[],
    collection: string = 'default',
  ): Promise<void> {
    const vectorStore = await this.getOrCreateVectorStore(collection);
    await vectorStore.delete({ ids });
    this.logger.info({
      event: 'documents_deleted',
      collection,
      count: ids.length,
    });
  }

  /**
   * 相似性搜索
   */
  async similaritySearch(
    query: string,
    k: number = 5,
    collection: string = 'default',
  ): Promise<Document[]> {
    const vectorStore = await this.getOrCreateVectorStore(collection);
    return vectorStore.similaritySearch(query, k);
  }

  /**
   * 带分数的相似性搜索
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 5,
    collection: string = 'default',
  ): Promise<[Document, number][]> {
    const vectorStore = await this.getOrCreateVectorStore(collection);
    return vectorStore.similaritySearchWithScore(query, k);
  }

  /**
   * 获取向量存储作为 Retriever
   */
  async asRetriever(collection: string = 'default', k: number = 5) {
    const vectorStore = await this.getOrCreateVectorStore(collection);
    return vectorStore.asRetriever({ k });
  }
}
