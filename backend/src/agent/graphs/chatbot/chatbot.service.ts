import type { ChatMessageContentBlock } from '@/shared/schemas/content-blocks';
import type { ChatMessageContent } from '@/shared/schemas/requests';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToolsService } from '@/agent/tools';
import {
  buildChatbotSystemPrompt,
  type PersonaConfig,
  DEFAULT_PERSONA,
} from '@/agent/prompts';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private checkpointer: PostgresSaver;
  private appCache = new Map<string, ReturnType<typeof this.compileWorkflow>>();
  private currentPersona: Partial<PersonaConfig> = {};

  constructor(
    private readonly config: ConfigService,
    private readonly tools: ToolsService,
  ) {}

  async onModuleInit() {
    const databaseUrl = this.config.get<string>('DATABASE_URL');
    this.checkpointer = PostgresSaver.fromConnString(databaseUrl!);
    try {
      await this.checkpointer.setup();
    } catch (error: unknown) {
      // Ignore duplicate key error when tables already exist
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log('[ChatbotService] Checkpoint tables already exist');
      } else {
        throw error;
      }
    }
    console.log('[ChatbotService] Checkpointer initialized');
  }

  /**
   * 设置人格配置
   */
  setPersona(persona: Partial<PersonaConfig>) {
    this.currentPersona = persona;
    // 清除缓存，下次会用新的人格重新编译
    this.appCache.clear();
    console.log('[ChatbotService] Persona updated:', persona.name || 'default');
  }

  /**
   * 获取当前人格配置
   */
  getPersona(): PersonaConfig {
    return { ...DEFAULT_PERSONA, ...this.currentPersona };
  }

  /**
   * 获取系统指令
   */
  private getSystemMessage(): SystemMessage {
    const toolNames = this.tools.getEnabledToolNames();
    const prompt = buildChatbotSystemPrompt(this.currentPersona, toolNames);
    return new SystemMessage(prompt);
  }

  createHumanMessage(message: ChatMessageContent): HumanMessage {
    if (typeof message === 'string') {
      return new HumanMessage(message);
    }

    const content = message.map((block: ChatMessageContentBlock) => {
      switch (block.type) {
        case 'text':
          return { type: 'text' as const, text: block.text };
        case 'image_url':
          return {
            type: 'image_url' as const,
            image_url: {
              url: block.image_url.url,
              detail: block.image_url.detail,
            },
          };
        case 'media':
          return {
            type: 'image_url' as const,
            image_url: { url: block.media.url },
          };
        case 'document':
          return {
            type: 'image_url' as const,
            image_url: { url: block.document.url },
          };
      }
    });

    return new HumanMessage({ content });
  }

  /**
   * 创建模型实例
   */
  private createModelInstance(modelId: string) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const baseURL = this.config.get<string>('OPENAI_BASE_URL');
    const timeout = parseInt(
      this.config.get<string>('OPENAI_TIMEOUT') || '120000',
    );

    console.log(`[ChatbotService] Creating model: ${modelId}`);
    console.log(`[ChatbotService] Base URL: ${baseURL}`);

    return new ChatOpenAI({
      model: modelId,
      apiKey,
      temperature: 0.7,
      streaming: true,
      timeout,
      configuration: { baseURL },
    });
  }

  /**
   * 编译带工具的工作流
   */
  private compileWorkflow(modelId: string) {
    const allTools = this.tools.getAllTools();
    const model = this.createModelInstance(modelId).bindTools(allTools);
    const toolNode = new ToolNode(allTools);

    // 获取系统指令的引用
    const getSystemMessage = () => this.getSystemMessage();

    const chatbotNode = async (state: typeof MessagesAnnotation.State) => {
      // 准备消息列表
      let messagesToSend = state.messages;

      // 检查是否已有 SystemMessage（避免重复注入）
      const hasSystemMessage = state.messages.some(
        (msg) => msg._getType() === 'system',
      );

      if (!hasSystemMessage) {
        // 首次对话，注入系统指令
        const systemMessage = getSystemMessage();
        messagesToSend = [systemMessage, ...state.messages];
        console.log('[ChatbotService] Injected SystemMessage');
      }

      console.log(
        '[ChatbotService] Invoking model with',
        messagesToSend.length,
        'messages',
      );

      try {
        const res = await model.invoke(messagesToSend);
        console.log('[ChatbotService] Model response received');
        return { messages: [res] };
      } catch (error) {
        console.error('[ChatbotService] Model invoke error:', error);
        throw error;
      }
    };

    const shouldContinue = (state: typeof MessagesAnnotation.State) => {
      const lastMessage = state.messages[
        state.messages.length - 1
      ] as AIMessage;
      if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return 'tools';
      }
      return END;
    };

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('chatbot', chatbotNode)
      .addNode('tools', toolNode)
      .addEdge(START, 'chatbot')
      .addConditionalEdges('chatbot', shouldContinue, ['tools', END])
      .addEdge('tools', 'chatbot');

    return workflow.compile({ checkpointer: this.checkpointer });
  }

  /**
   * 获取 App 实例（带缓存）
   */
  getApp(modelId: string = 'gpt-4o') {
    if (!this.appCache.has(modelId)) {
      console.log(`[ChatbotService] Creating app for model: ${modelId}`);
      this.appCache.set(modelId, this.compileWorkflow(modelId));
    }
    return this.appCache.get(modelId)!;
  }

  /**
   * 获取聊天历史
   */
  async getHistory(threadId: string, modelId?: string) {
    const app = this.getApp(modelId);
    const state = await app.getState({ configurable: { thread_id: threadId } });
    return state?.values?.messages || [];
  }
}
