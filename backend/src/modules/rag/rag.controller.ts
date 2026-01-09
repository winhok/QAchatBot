import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import type { AddDocumentDto, AddDocumentsDto, RagQueryDto } from './dto'
import { AddDocumentSchema, AddDocumentsSchema, RagQuerySchema } from './dto'
import { DocumentService, RagQueryResult, RagService } from './services'

/**
 * RAG API 控制器
 * 提供文档管理和 RAG 查询接口
 */
@Controller('api/rag')
export class RagController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly ragService: RagService,
  ) {}

  /**
   * 添加单个文档到知识库
   */
  @Post('documents')
  async addDocument(
    @Body(new ZodValidationPipe(AddDocumentSchema)) dto: AddDocumentDto,
  ): Promise<{ id: string }> {
    const id = await this.documentService.addDocument(dto.content, dto.metadata, dto.collection)
    return { id }
  }

  /**
   * 批量添加文档到知识库
   */
  @Post('documents/batch')
  async addDocuments(
    @Body(new ZodValidationPipe(AddDocumentsSchema)) dto: AddDocumentsDto,
  ): Promise<{ ids: string[] }> {
    const ids = await this.documentService.addDocuments(dto.documents, dto.collection)
    return { ids }
  }

  /**
   * 删除文档
   */
  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string): Promise<void> {
    await this.documentService.deleteDocument(id)
  }

  /**
   * 获取文档
   */
  @Get('documents/:id')
  async getDocument(@Param('id') id: string) {
    return this.documentService.getDocument(id)
  }

  /**
   * 列出文档
   */
  @Get('documents')
  async listDocuments(@Query('collection') collection?: string) {
    return this.documentService.listDocuments(collection)
  }

  /**
   * 获取文档统计
   */
  @Get('stats')
  async getStats() {
    return this.documentService.getStats()
  }

  /**
   * RAG 查询
   */
  @Post('query')
  async query(
    @Body(new ZodValidationPipe(RagQuerySchema)) dto: RagQueryDto,
  ): Promise<RagQueryResult> {
    return this.ragService.query(dto.question, {
      collection: dto.collection,
      topK: dto.topK,
      relevanceThreshold: dto.relevanceThreshold,
    })
  }
}
