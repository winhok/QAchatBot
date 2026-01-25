import { ChatbotService } from '@/agent/graphs/chatbot'
import type { ChatMessageContent } from '@/shared/schemas/requests'
import { Injectable } from '@nestjs/common'
import type { Response } from 'express'
import type { Prisma } from '../../../../generated/prisma/index.js'
import { MessagesService } from '../messages/messages.service'
import { ReasoningService } from '../reasoning/reasoning.service'
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
interface StreamChunk {
  content?: string
  thinking_content?: string // Claude extended thinking
  reasoning?: string // DeepSeek R1
  thought?: string // 通义千问
  usage_metadata?: unknown
  tool_call_chunks?: unknown[]
}

interface StreamEvent {
  event: string
  name?: string
  run_id?: string
  data?: {
    chunk?: StreamChunk
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

/**
 * Extract reasoning content from chunk (supports multiple model formats)
 */
function extractReasoningFromChunk(chunk: StreamChunk | undefined): string | undefined {
  if (!chunk) return undefined
  return chunk.thinking_content || chunk.reasoning || chunk.thought
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatbot: ChatbotService,
    private readonly sessions: SessionsService,
    private readonly messages: MessagesService,
    private readonly reasoning: ReasoningService,
  ) {}

  async getHistory(
    threadId: string,
    checkpointId?: string,
    modelId?: string,
  ): Promise<{ messages: unknown[]; checkpointId?: string; parentCheckpointId?: string }> {
    return this.chatbot.getHistory(threadId, checkpointId, modelId)
  }

  async getCheckpoints(
    threadId: string,
    modelId?: string,
  ): Promise<
    Array<{
      checkpointId: string
      parentCheckpointId: string | null
      timestamp: string
      preview: string
      messageCount: number
    }>
  > {
    return this.chatbot.getCheckpoints(threadId, modelId)
  }

  async getBranches(
    threadId: string,
    checkpointId: string,
    modelId?: string,
  ): Promise<{
    branches: Array<{
      checkpointId: string
      preview: string
      createdAt: string
      isCurrent: boolean
    }>
    currentIndex: number
    total: number
  }> {
    return this.chatbot.getBranches(threadId, checkpointId, modelId)
  }

  async getBranchCount(threadId: string, modelId?: string): Promise<number> {
    return this.chatbot.getBranchCount(threadId, modelId)
  }

  async buildTree(
    threadId: string,
    modelId?: string,
  ): Promise<{
    nodes: Array<{
      checkpointId: string
      parentCheckpointId: string | null
      preview: string
      messageCount: number
      createdAt: string
      role: 'user' | 'assistant'
    }>
  }> {
    return this.chatbot.buildTree(threadId, modelId)
  }

  async getDiff(
    threadId: string,
    checkpointA: string,
    checkpointB: string,
    modelId?: string,
  ): Promise<{
    branchA: { checkpointId: string; messages: Array<{ role: string; content: string }> }
    branchB: { checkpointId: string; messages: Array<{ role: string; content: string }> }
    commonAncestor: string | null
  }> {
    return this.chatbot.getDiff(threadId, checkpointA, checkpointB, modelId)
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

    // Support branching from a specific checkpoint (LangGraph Time Travel)
    const threadConfig = {
      configurable: {
        thread_id: sessionId,
        ...(checkpointId && { checkpoint_id: checkpointId }),
      },
    }

    // Track tool calls: runId -> tool info
    const toolCallsMap = new Map<string, ToolCallInfo>()

    let accumulatedContent = ''

    // Reasoning tracking
    let reasoningContent = ''
    let reasoningStartTime: number | null = null

    const eventStream = (
      app as { streamEvents: (input: unknown, config: unknown) => AsyncIterable<StreamEvent> }
    ).streamEvents({ messages: [userMessage] }, { version: 'v2', ...threadConfig })

    try {
      for await (const event of eventStream) {
        if (isAborted()) {
          console.log('[Chat Service] Client disconnected, stopping')
          break
        }

        switch (event.event) {
          case 'on_chat_model_stream': {
            const chunk = event.data?.chunk
            if (!chunk) break

            // Check for reasoning content
            const reasoningChunk = extractReasoningFromChunk(chunk)
            if (reasoningChunk) {
              if (!reasoningStartTime) {
                reasoningStartTime = Date.now()
                writeSSE(res, { type: 'reasoning_start' })
              }
              reasoningContent += reasoningChunk
              writeSSE(res, {
                type: 'reasoning',
                content: reasoningChunk,
              })
              break // Don't process as regular content
            }

            // If we were in reasoning mode and now get regular content, reasoning is complete
            if (reasoningStartTime && chunk.content) {
              const reasoningDuration = Date.now() - reasoningStartTime
              writeSSE(res, {
                type: 'reasoning_end',
                duration: reasoningDuration,
              })
              reasoningStartTime = null // Reset, reasoning complete
            }

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
              name: toolInfo?.name ?? 'unknown_tool',
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
              name: toolInfo?.name ?? 'unknown_tool',
              error: formatError(error),
              duration,
            })

            toolCallsMap.delete(runId)
            break
          }
        }
      }
    } catch (streamError) {
      console.error('[ChatService] Stream error:', streamError)
      writeSSE(res, {
        type: 'error',
        error: formatError(streamError),
      })
    }

    // Save accumulated content to assistant message
    if (accumulatedContent) {
      await this.messages.updateContent(assistantMessage.id, accumulatedContent)
    }

    // Get the latest checkpoint_id after streaming
    let latestCheckpointId: string | undefined
    try {
      const latestState = await app.getState({ configurable: { thread_id: sessionId } })
      latestCheckpointId = latestState?.config?.configurable?.checkpoint_id as string | undefined
    } catch {
      // Ignore errors getting checkpoint
    }

    // Save reasoning to database if we have any
    if (reasoningContent && latestCheckpointId) {
      const reasoningDuration = reasoningStartTime ? Date.now() - reasoningStartTime : undefined
      try {
        await this.reasoning.create({
          sessionId,
          checkpointId: latestCheckpointId,
          content: reasoningContent,
          duration: reasoningDuration,
        })
        console.log(`[ChatService] Saved reasoning for checkpoint ${latestCheckpointId}`)
      } catch (err) {
        console.error('[ChatService] Failed to save reasoning:', err)
      }
    }

    // Send end signal with checkpoint_id and reasoning indicator
    writeSSE(res, {
      type: 'end',
      status: isAborted() ? 'aborted' : 'success',
      session_id: sessionId,
      checkpoint_id: latestCheckpointId,
      has_reasoning: !!reasoningContent,
    })
  }
}
