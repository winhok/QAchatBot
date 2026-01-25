import { ChatbotService } from '@/agent/graphs/chatbot'
import { Injectable } from '@nestjs/common'
import type { Response } from 'express'
import { SessionsService } from '../sessions/sessions.service'

interface MergeParams {
  userId: string
  sessionId: string
  checkpointA: string
  checkpointB: string
  modelId?: string
  instruction?: string
  res: Response
  isAborted: () => boolean
}

/**
 * 处理分支合并的服务
 * 使用 AI 整合两个分支的精华，创建新的独立 Session
 */
@Injectable()
export class MergeService {
  constructor(
    private readonly chatbot: ChatbotService,
    private readonly sessions: SessionsService,
  ) {}

  /**
   * 合并两个分支的对话内容
   * 流式输出合并结果，完成后创建新 Session
   */
  async mergeBranches(params: MergeParams): Promise<void> {
    const {
      userId,
      sessionId,
      checkpointA,
      checkpointB,
      modelId = 'gpt-4o',
      instruction,
      res,
      isAborted,
    } = params

    // 获取两个分支的差异
    const diff = await this.chatbot.getDiff(sessionId, checkpointA, checkpointB, modelId)

    // 构建合并 prompt
    const mergePrompt = this.buildMergePrompt(
      diff.branchA.messages,
      diff.branchB.messages,
      instruction,
    )

    // 创建新 Session 用于存储合并结果
    const newSession = await this.sessions.create(userId, {
      name: `合并: ${new Date().toLocaleString('zh-CN')}`,
    })

    // 获取 LangGraph app 实例
    const app = this.chatbot.getApp(modelId)

    // 使用新的 thread_id 调用模型
    const humanMessage = this.chatbot.createHumanMessage(mergePrompt)

    let accumulatedContent = ''

    try {
      const eventStream = (
        app as { streamEvents: (input: unknown, config: unknown) => AsyncIterable<StreamEvent> }
      ).streamEvents(
        { messages: [humanMessage] },
        {
          version: 'v2',
          configurable: { thread_id: newSession.id },
        },
      )

      for await (const event of eventStream) {
        if (isAborted()) {
          console.log('[MergeService] Client disconnected')
          break
        }

        if (event.event === 'on_chat_model_stream') {
          const chunk = event.data?.chunk
          if (chunk?.content) {
            accumulatedContent += chunk.content
            res.write(
              JSON.stringify({
                type: 'chunk',
                content: chunk.content,
              }) + '\n',
            )
          }
        }
      }
    } catch (error) {
      console.error('[MergeService] Stream error:', error)
      res.write(
        JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : String(error),
        }) + '\n',
      )
      return
    }

    // 发送结束信号，包含新 Session ID
    res.write(
      JSON.stringify({
        type: 'end',
        new_session_id: newSession.id,
        merged_content_length: accumulatedContent.length,
      }) + '\n',
    )
  }

  /**
   * 构建合并 prompt
   */
  private buildMergePrompt(
    messagesA: Array<{ role: string; content: string }>,
    messagesB: Array<{ role: string; content: string }>,
    userInstruction?: string,
  ): string {
    const formatMessages = (messages: Array<{ role: string; content: string }>) =>
      messages.map((m) => `[${m.role === 'user' ? '用户' : '助手'}]: ${m.content}`).join('\n\n')

    let prompt = `你是一个对话合并专家。请整合以下两个对话分支的精华内容，生成一个综合性的回答。

## 分支 A 的对话:
${formatMessages(messagesA)}

## 分支 B 的对话:
${formatMessages(messagesB)}

## 任务:
请分析这两个分支的对话，提取各自的要点和精华，生成一个综合性的总结或回答。
保留两个分支中有价值的信息，去除重复内容，形成一个更完整的答案。`

    if (userInstruction) {
      prompt += `\n\n## 用户额外指令:\n${userInstruction}`
    }

    return prompt
  }
}

/**
 * LangGraph stream event types
 */
interface StreamEvent {
  event: string
  data?: {
    chunk?: {
      content?: string
    }
  }
}
