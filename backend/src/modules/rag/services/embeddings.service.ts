import { OpenAIEmbeddings } from '@langchain/openai'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * 嵌入向量服务
 * 封装 OpenAI Embeddings，用于生成文本的向量表示
 */
@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.embeddings = new OpenAIEmbeddings({
      model: this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small',
      configuration: {
        baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      },
    })
  }

  /**
   * 获取 OpenAIEmbeddings 实例
   */
  getEmbeddings(): OpenAIEmbeddings {
    return this.embeddings
  }

  /**
   * 为单个文本生成嵌入向量
   */
  async embed(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text)
  }

  /**
   * 批量生成嵌入向量
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts)
  }
}
