/**
 * QA Chatbot Agent NestJS 服务
 */
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compileQAChatbotGraph } from './graph';
import type { QAWorkflowStage } from './types';

@Injectable()
export class QaChatbotService implements OnModuleInit {
  private checkpointer: PostgresSaver;
  private model: ChatOpenAI;
  private app: ReturnType<typeof compileQAChatbotGraph>;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.initCheckpointer();
    this.initModel();
    this.compileGraph();
    console.log('[QaChatbotService] Initialized');
  }

  /**
   * 初始化 Checkpointer
   */
  private async initCheckpointer() {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    this.checkpointer = PostgresSaver.fromConnString(databaseUrl!);

    try {
      await this.checkpointer.setup();
    } catch (error: unknown) {
      // 忽略表已存在的错误
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log('[QaChatbotService] Checkpoint tables already exist');
      } else {
        throw error;
      }
    }
  }

  /**
   * 初始化 Model
   */
  private initModel() {
    this.model = new ChatOpenAI({
      model: this.config.get<string>('OPENAI_MODEL') || 'gpt-4o',
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      timeout: parseInt(this.config.get<string>('OPENAI_TIMEOUT') || '120000'),
      maxRetries: parseInt(
        this.config.get<string>('OPENAI_MAX_RETRIES') || '3',
      ),
      temperature: 0.2,
      streaming: true,
      configuration: {
        baseURL: this.config.get<string>('OPENAI_BASE_URL'),
      },
    });
  }

  /**
   * 编译工作流
   */
  private compileGraph() {
    this.app = compileQAChatbotGraph(this.model, this.checkpointer);
  }

  /**
   * 获取编译后的 App 实例
   */
  getApp() {
    return this.app;
  }

  /**
   * 获取会话状态
   */
  async getState(threadId: string) {
    return await this.app.getState({ configurable: { thread_id: threadId } });
  }

  /**
   * 获取当前工作流阶段
   */
  async getStage(threadId: string): Promise<QAWorkflowStage> {
    const state = await this.getState(threadId);
    const values = state?.values as { stage?: QAWorkflowStage } | undefined;
    return values?.stage || 'init';
  }

  /**
   * 获取聊天历史
   */
  async getHistory(threadId: string): Promise<unknown[]> {
    const state = await this.getState(threadId);
    const values = state?.values as { messages?: unknown[] } | undefined;
    return values?.messages || [];
  }

  /**
   * 获取测试产物
   */
  async getArtifacts(threadId: string) {
    const state = await this.getState(threadId);
    const values = state?.values as Record<string, unknown> | undefined;
    return {
      prdContent: (values?.prdContent as string) || '',
      testPoints: (values?.testPoints as string) || '',
      testCases: (values?.testCases as string) || '',
    };
  }
}
