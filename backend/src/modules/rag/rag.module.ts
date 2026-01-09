import { PrismaModule } from '@/infrastructure/database/prisma.module'
import { Module } from '@nestjs/common'
import { RagController } from './rag.controller'
import { DocumentService, EmbeddingsService, RagService, VectorStoreService } from './services'

/**
 * RAG 模块
 * 提供基于 pgvector 的向量搜索和检索增强生成功能
 */
@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [EmbeddingsService, VectorStoreService, DocumentService, RagService],
  exports: [DocumentService, RagService, VectorStoreService],
})
export class RagModule {}
