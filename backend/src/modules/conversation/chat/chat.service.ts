import { ChatbotService } from '@/agent/graphs/chatbot'
import { QaChatbotService } from '@/agent/graphs/qa-chatbot'
import type { SessionType } from '@/shared/schemas/enums'
import type { ChatMessageContent } from '@/shared/schemas/requests'
import { Injectable } from '@nestjs/common'
import type { Response } from 'express'
import type { Prisma } from '../../../../generated/prisma/index.js'
import { MessagesService } from '../messages/messages.service'
import { SessionsService } from '../sessions/sessions.service'

interface StreamChatParams {
  message: ChatMessageContent
  sessionId: string
  modelId: string
  sessionType: SessionType
  res: Response
  isAborted: () => boolean
  tools?: string[]
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

@Injectable()
export class ChatService {
  constructor(
    private readonly chatbot: ChatbotService,
    private readonly qaChatbot: QaChatbotService,
    private readonly sessions: SessionsService,
    private readonly messages: MessagesService,
  ) {}

  async getHistory(threadId: string, modelId?: string): Promise<unknown[]> {
    return this.chatbot.getHistory(threadId, modelId)
  }

  /**
   * Extract session name from message content
   * Supports string and multimodal array formats
   */
  extractSessionName(message: ChatMessageContent): string {
    const MAX_LENGTH = 50
    const DEFAULT_NAME = '新会话'

    const truncate = (text: string): string => {
      const trimmed = text.trim()
      return trimmed.length > MAX_LENGTH ? trimmed.slice(0, MAX_LENGTH) + '...' : trimmed
    }

    if (typeof message === 'string') {
      return truncate(message)
    }

    // Extract first text block from multimodal content
    const textBlock = message.find(
      (block): block is { type: 'text'; text: string } => block.type === 'text',
    )

    return textBlock ? truncate(textBlock.text) : DEFAULT_NAME
  }

  async streamChat(params: StreamChatParams) {
    const { message, sessionId, modelId, sessionType, res, isAborted, tools } = params

    // Ensure session exists, and auto-name if new
    const session = await this.sessions.findOrCreate(sessionId, sessionType)
    if (!session.name) {
      const autoName = this.extractSessionName(message)
      await this.sessions.update(sessionId, { name: autoName })
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

    // Dispatch based on session type
    let app: any // Using any to accommodate different graph types
    if (sessionType === 'testcase') {
      console.log('[ChatService] Dispatching to QA Chatbot')
      app = this.qaChatbot.getApp()
    } else {
      console.log('[ChatService] Dispatching to General Chatbot')
      app = this.chatbot.getApp(modelId, tools)
    }

    const threadConfig = { configurable: { thread_id: sessionId } }

    // Track tool calls: runId -> { dbId, name, startTime }
    const toolCallsMap = new Map<string, { dbId?: string; name: string; startTime: number }>()

    let accumulatedContent = ''

    const eventStream = (
      app as { streamEvents: (input: unknown, config: unknown) => AsyncIterable<StreamEvent> }
    ).streamEvents({ messages: [userMessage] }, { version: 'v2', ...threadConfig })

    for await (const event of eventStream) {
      if (isAborted()) {
        console.log('[Chat Service] Client disconnected, stopping')
        break
      }

      // Handle model streaming output
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk

        if (chunk) {
          const dataObj: Record<string, unknown> = {
            type: 'chunk',
            content: chunk.content,
          }

          // Accumulate content for database
          if (chunk.content) {
            accumulatedContent += chunk.content
          }

          if (chunk.usage_metadata) {
            dataObj.usage_metadata = chunk.usage_metadata
          }

          if (chunk.tool_call_chunks?.length) {
            dataObj.tool_call_chunks = chunk.tool_call_chunks
          }

          res.write(JSON.stringify(dataObj) + '\n')
        }
      }

      // Handle tool call start
      if (event.event === 'on_tool_start') {
        const toolName = event.name ?? 'unknown_tool'
        const runId = event.run_id ?? ''
        const inputData = event.data?.input ?? {}

        // Create tool call in database
        const toolCall = await this.messages.createToolCall({
          messageId: assistantMessage.id,
          toolCallId: runId,
          toolName,
          args: inputData as Prisma.InputJsonValue,
        })

        // Update status to running
        await this.messages.updateToolCall(toolCall.id, { status: 'running' })

        toolCallsMap.set(runId, {
          dbId: toolCall.id,
          name: toolName,
          startTime: Date.now(),
        })

        res.write(
          JSON.stringify({
            type: 'tool_start',
            tool_call_id: runId,
            name: toolName,
            input: inputData,
          }) + '\n',
        )
      }

      // Handle tool call end
      if (event.event === 'on_tool_end') {
        const runId = event.run_id ?? ''
        const toolInfo = toolCallsMap.get(runId)
        const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined
        const outputData = event.data?.output

        // Update tool call in database
        if (toolInfo?.dbId) {
          await this.messages.updateToolCall(toolInfo.dbId, {
            status: 'completed',
            result: outputData as Prisma.InputJsonValue | undefined,
            duration,
          })
        }

        res.write(
          JSON.stringify({
            type: 'tool_end',
            tool_call_id: runId,
            name: toolInfo?.name || 'unknown_tool',
            output: outputData,
            duration,
          }) + '\n',
        )

        toolCallsMap.delete(runId)
      }

      // Handle tool call error
      if (event.event === 'on_tool_error') {
        const runId = event.run_id ?? ''
        const error = event.data?.error
        const toolInfo = toolCallsMap.get(runId)
        const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined

        // Update tool call in database with error
        if (toolInfo?.dbId) {
          await this.messages.updateToolCall(toolInfo.dbId, {
            status: 'error',
            result: {
              error: error instanceof Error ? error.message : String(error),
            },
            duration,
          })
        }

        res.write(
          JSON.stringify({
            type: 'tool_error',
            tool_call_id: runId,
            name: toolInfo?.name || 'unknown_tool',
            error: error instanceof Error ? error.message : String(error),
            duration,
          }) + '\n',
        )

        toolCallsMap.delete(runId)
      }
    }

    // Save accumulated content to assistant message
    if (accumulatedContent) {
      await this.messages.updateContent(assistantMessage.id, accumulatedContent)
    }

    // Send end signal
    res.write(
      JSON.stringify({
        type: 'end',
        status: isAborted() ? 'aborted' : 'success',
        session_id: sessionId,
      }) + '\n',
    )
  }
}
