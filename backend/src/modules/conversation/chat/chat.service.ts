import { ChatbotService } from '@/agent/graphs/chatbot'
import type { ChatMessageContent } from '@/shared/schemas/requests'
import { Injectable } from '@nestjs/common'
import type { Response } from 'express'
import type { Prisma } from '../../../../generated/prisma/index.js'
import { MessagesService } from '../messages/messages.service'
import { SessionsService } from '../sessions/sessions.service'

interface StreamChatParams {
  userId: string
  message: ChatMessageContent
  sessionId: string
  modelId: string
  res: Response
  isAborted: () => boolean
  tools?: string[]
  checkpointId?: string // 从指定 checkpoint 分叉
}

/**
 * LangGraph stream event types
 */
interface StreamEvent {
  event: string
  name?: string
  run_id?: string
  data?: {
    chunk?: {
      content?: string
      usage_metadata?: unknown
      tool_call_chunks?: unknown[]
    }
    input?: unknown
    output?: unknown
    error?: unknown
  }
}

interface ToolCallInfo {
  dbId?: string
  name: string
  startTime: number
}

/**
 * Write SSE-formatted JSON to response
 */
function writeSSE(res: Response, data: Record<string, unknown>): void {
  res.write(JSON.stringify(data) + '\n')
}

/**
 * Format error for response
 */
function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatbot: ChatbotService,
    private readonly sessions: SessionsService,
    private readonly messages: MessagesService,
  ) {}

  async getHistory(threadId: string, modelId?: string): Promise<unknown[]> {
    return this.chatbot.getHistory(threadId, modelId)
  }

  async getCheckpoints(threadId: string, modelId?: string) {
    return this.chatbot.getCheckpoints(threadId, modelId)
  }

  /**
   * Extract session name from message content
   * Supports string and multimodal array formats
   */
  extractSessionName(message: ChatMessageContent): string {
    const MAX_LENGTH = 50
    const DEFAULT_NAME = '新会话'

    const truncate = (text: string): string =>
      text.trim().length > MAX_LENGTH ? text.trim().slice(0, MAX_LENGTH) + '...' : text.trim()

    if (typeof message === 'string') {
      return truncate(message)
    }

    const textBlock = message.find((block) => block.type === 'text')
    return textBlock && 'text' in textBlock ? truncate(textBlock.text) : DEFAULT_NAME
  }

  async streamChat(params: StreamChatParams) {
    const { userId, message, sessionId, modelId, res, isAborted, tools, checkpointId } = params

    // Ensure session exists, and auto-name if new
    const session = await this.sessions.findOrCreate(userId, sessionId)
    if (!session.name) {
      const autoName = this.extractSessionName(message)
      await this.sessions.update(userId, sessionId, { name: autoName })
    }

    // Save user message
    const userMessageContent = typeof message === 'string' ? message : JSON.stringify(message)
    await this.messages.create({
      sessionId,
      role: 'user',
      content: userMessageContent,
    })

    // Create assistant message placeholder
    const assistantMessage = await this.messages.create({
      sessionId,
      role: 'assistant',
      content: '',
      metadata: { modelId },
    })

    const userMessage = this.chatbot.createHumanMessage(message)

    // Use general chatbot (QA capabilities are now available as tools)
    console.log('[ChatService] Dispatching to Chatbot')
    const app = this.chatbot.getApp(modelId, tools)

    // 支持从指定 checkpoint 分叉 (LangGraph Time Travel)
    const threadConfig = {
      configurable: {
        thread_id: sessionId,
        ...(checkpointId && { checkpoint_id: checkpointId }),
      },
    }

    // Track tool calls: runId -> tool info
    const toolCallsMap = new Map<string, ToolCallInfo>()

    let accumulatedContent = ''

    const eventStream = (
      app as { streamEvents: (input: unknown, config: unknown) => AsyncIterable<StreamEvent> }
    ).streamEvents({ messages: [userMessage] }, { version: 'v2', ...threadConfig })

    for await (const event of eventStream) {
      if (isAborted()) {
        console.log('[Chat Service] Client disconnected, stopping')
        break
      }

      switch (event.event) {
        case 'on_chat_model_stream': {
          const chunk = event.data?.chunk
          if (!chunk) break

          const dataObj: Record<string, unknown> = {
            type: 'chunk',
            content: chunk.content,
          }

          if (chunk.content) {
            accumulatedContent += chunk.content
          }

          if (chunk.usage_metadata) {
            dataObj.usage_metadata = chunk.usage_metadata
          }

          if (chunk.tool_call_chunks?.length) {
            dataObj.tool_call_chunks = chunk.tool_call_chunks
          }

          writeSSE(res, dataObj)
          break
        }

        case 'on_tool_start': {
          const toolName = event.name ?? 'unknown_tool'
          const runId = event.run_id ?? ''
          const inputData = event.data?.input ?? {}

          const toolCall = await this.messages.createToolCall({
            messageId: assistantMessage.id,
            toolCallId: runId,
            toolName,
            args: inputData as Prisma.InputJsonValue,
          })

          await this.messages.updateToolCall(toolCall.id, { status: 'running' })

          toolCallsMap.set(runId, {
            dbId: toolCall.id,
            name: toolName,
            startTime: Date.now(),
          })

          writeSSE(res, {
            type: 'tool_start',
            tool_call_id: runId,
            name: toolName,
            input: inputData,
          })
          break
        }

        case 'on_tool_end': {
          const runId = event.run_id ?? ''
          const toolInfo = toolCallsMap.get(runId)
          const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined
          const outputData = event.data?.output

          if (toolInfo?.dbId) {
            await this.messages.updateToolCall(toolInfo.dbId, {
              status: 'completed',
              result: outputData as Prisma.InputJsonValue | undefined,
              duration,
            })
          }

          writeSSE(res, {
            type: 'tool_end',
            tool_call_id: runId,
            name: toolInfo?.name || 'unknown_tool',
            output: outputData,
            duration,
          })

          toolCallsMap.delete(runId)
          break
        }

        case 'on_tool_error': {
          const runId = event.run_id ?? ''
          const error = event.data?.error
          const toolInfo = toolCallsMap.get(runId)
          const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined

          if (toolInfo?.dbId) {
            await this.messages.updateToolCall(toolInfo.dbId, {
              status: 'error',
              result: { error: formatError(error) },
              duration,
            })
          }

          writeSSE(res, {
            type: 'tool_error',
            tool_call_id: runId,
            name: toolInfo?.name || 'unknown_tool',
            error: formatError(error),
            duration,
          })

          toolCallsMap.delete(runId)
          break
        }
      }
    }

    // Save accumulated content to assistant message
    if (accumulatedContent) {
      await this.messages.updateContent(assistantMessage.id, accumulatedContent)
    }

    // Send end signal
    writeSSE(res, {
      type: 'end',
      status: isAborted() ? 'aborted' : 'success',
      session_id: sessionId,
    })
  }
}
