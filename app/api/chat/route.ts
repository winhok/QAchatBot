import { getApp } from '@/app/agent/chatbot'
import { getSession } from '@/app/agent/db'
import { getQaChatbotApp } from '@/app/agent/qa-chatbot-agent'
import { DEFAULT_MODEL_ID } from '@/app/config/models'
import { ChatRequestSchema, type ChatMessageContent, type SessionType } from '@/app/schemas'
import '@/app/utils/loadEnv'
import { HumanMessage } from '@langchain/core/messages'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { validate as isUuid } from 'uuid'

/**
 * 根据消息内容创建 HumanMessage
 * 支持纯文本字符串或多模态内容块数组
 */
function createHumanMessage(message: ChatMessageContent): HumanMessage {
  if (typeof message === 'string') {
    return new HumanMessage(message)
  }
  // 多模态内容块数组，转换为 LangChain 格式
  const content = message.map(block => {
    switch (block.type) {
      case 'text':
        return { type: 'text' as const, text: block.text }
      case 'image_url':
        return {
          type: 'image_url' as const,
          image_url: {
            url: block.image_url.url,
            detail: block.image_url.detail,
          },
        }
      case 'media':
        // 视频/音频：使用 image_url 类型传递（部分模型支持）
        return {
          type: 'image_url' as const,
          image_url: { url: block.media.url },
        }
      case 'document':
        // PDF 等文档：使用 image_url 类型传递（部分模型支持）
        return {
          type: 'image_url' as const,
          image_url: { url: block.document.url },
        }
      default:
        return { type: 'text' as const, text: '' }
    }
  })
  return new HumanMessage({ content })
}

/**
 * 从多模态消息中提取文本内容，用于会话命名等场景
 */
function extractTextFromMessage(message: ChatMessageContent): string {
  if (typeof message === 'string') {
    return message
  }
  return message
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join(' ')
}

function withResponseLogging(request: NextRequest, response: Response): Response {
  const transferEncoding = response.headers.get('transfer-encoding')?.toLowerCase() || ''
  const contentType = response.headers.get('content-type') || ''
  const isStreaming = transferEncoding.includes('chunked') || contentType.includes('text/event-stream')

  if (!isStreaming || !response.body) {
    void (async () => {
      try {
        const clone = response.clone()
        const body = await clone.text()
        const truncated =
          body.length > 10_000 ? `${body.slice(0, 10_000)}...[truncated ${body.length - 10_000} chars]` : body
        console.log('[API RESPONSE]', request.method, request.url, response.status, contentType, truncated)
      } catch (e) {
        console.error('[API RESPONSE LOG ERROR]', request.method, request.url, response.status, String(e))
      }
    })()
    return response
  }

  const [clientStream, logStream] = response.body.tee()
  void (async () => {
    try {
      const reader = logStream.getReader()
      const decoder = new TextDecoder()
      let captured = ''
      let total = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          const chunkText = decoder.decode(value, { stream: true })
          total += chunkText.length
          if (captured.length < 10_000) {
            captured += chunkText.slice(0, 10_000 - captured.length)
          }
        }
      }
      if (captured.length === 10_000 && total > 10_000) {
        captured = `${captured}...[truncated ${total - 10_000} chars]`
      }
      console.log('[API RESPONSE]', request.method, request.url, response.status, contentType, captured)
    } catch (e) {
      console.error('[API RESPONSE LOG ERROR]', request.method, request.url, response.status, String(e))
    }
  })()

  return new Response(clientStream, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 使用 Zod 验证请求体
    const result = ChatRequestSchema.safeParse(body)
    if (!result.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
      return withResponseLogging(request, response)
    }

    const { message, thread_id, model_id, session_type } = result.data
    const userMessage = createHumanMessage(message)
    // messageText 可用于日志记录或会话命名（未来功能）
    // const messageText = extractTextFromMessage(message)
    const threadId = thread_id || randomUUID()
    const modelId = model_id || DEFAULT_MODEL_ID
    const sessionType: SessionType = session_type || 'normal'
    const threadConfig = { configurable: { thread_id: threadId } }

    // 获取请求的 AbortSignal，用于检测客户端断开连接
    const { signal } = request

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const toolCallsMap = new Map<string, { name: string; startTime: number }>()

          // 根据 session_type 选择不同的处理逻辑
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let eventStream: AsyncIterable<any>

          if (sessionType === 'testcase') {
            const qaChatbotApp = await getQaChatbotApp()
            // 传递 signal 给 LangGraph，支持取消流式输出
            eventStream = qaChatbotApp.streamEvents(
              { messages: [userMessage] },
              { version: 'v2', ...threadConfig, signal }
            )
          } else {
            const chatApp = await getApp(modelId)
            // 传递 signal 给 LangGraph，支持取消流式输出
            eventStream = chatApp.streamEvents(
              { messages: [userMessage] },
              { version: 'v2', ...threadConfig, signal }
            )
          }

          for await (const event of eventStream) {
            // 检查客户端是否已断开连接
            if (signal.aborted) {
              console.log('[Chat API] Client disconnected, stopping generation')
              break
            }

            // 处理模型流式输出
            if (event.event === 'on_chat_model_stream') {
              const chunk = event.data?.chunk
              if (chunk) {
                const dataObj: any = {
                  type: 'chunk',
                  content: chunk.content,
                }
                
                // 包含使用统计（如果有）
                if (chunk.usage_metadata) {
                  dataObj.usage_metadata = chunk.usage_metadata
                }
                
                // 包含工具调用片段（如果有）
                if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
                  dataObj.tool_call_chunks = chunk.tool_call_chunks
                }

                const data = JSON.stringify(dataObj) + '\n'
                controller.enqueue(new TextEncoder().encode(data))
              }
            }

            // 处理工具调用开始
            if (event.event === 'on_tool_start') {
              const toolName = event.name || 'unknown_tool'
              const runId = event.run_id
              const input = event.data?.input

              toolCallsMap.set(runId, { name: toolName, startTime: Date.now() })

              const data =
                JSON.stringify({
                  type: 'tool_start',
                  tool_call_id: runId,
                  name: toolName,
                  input: input,
                }) + '\n'
              controller.enqueue(new TextEncoder().encode(data))
            }

            // 处理工具调用结束
            if (event.event === 'on_tool_end') {
              const runId = event.run_id
              const output = event.data?.output
              const toolInfo = toolCallsMap.get(runId)
              const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined

              const data =
                JSON.stringify({
                  type: 'tool_end',
                  tool_call_id: runId,
                  name: toolInfo?.name || 'unknown_tool',
                  output: output,
                  duration: duration,
                }) + '\n'
              controller.enqueue(new TextEncoder().encode(data))

              toolCallsMap.delete(runId)
            }

            // 处理工具调用错误
            if (event.event === 'on_tool_error') {
              const runId = event.run_id
              const error = (event.data as { error?: unknown })?.error
              const toolInfo = toolCallsMap.get(runId)
              const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined

              const data =
                JSON.stringify({
                  type: 'tool_error',
                  tool_call_id: runId,
                  name: toolInfo?.name || 'unknown_tool',
                  error: error instanceof Error ? error.message : String(error),
                  duration: duration,
                }) + '\n'
              controller.enqueue(new TextEncoder().encode(data))

              toolCallsMap.delete(runId)
            }
          }
          const endData =
            JSON.stringify({
              type: 'end',
              status: 'success',
              thread_id: threadId,
            }) + '\n'
          controller.enqueue(new TextEncoder().encode(endData))
          controller.close()
        } catch (error) {
          // 处理用户主动取消的情况（AbortError）
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('[Chat API] Request aborted by client')
            try {
              const abortData =
                JSON.stringify({
                  type: 'end',
                  status: 'aborted',
                  thread_id: threadId,
                }) + '\n'
              controller.enqueue(new TextEncoder().encode(abortData))
            } catch {
              // 客户端已断开，忽略写入错误
            }
            controller.close()
            return
          }

          console.error('=== Error streaming chat ===')
          console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
          console.error('Error message:', error instanceof Error ? error.message : String(error))
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
          if (error && typeof error === 'object') {
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
          }
          console.error('============================')
          const errorData =
            JSON.stringify({
              type: 'error',
              status: 'internal error',
              message: 'Sorry, Something went wrong. Please try again later.',
            }) + '\n'
          controller.enqueue(new TextEncoder().encode(errorData))
          controller.close()
        }
      },
    })

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    return withResponseLogging(request, response)
  } catch (error) {
    console.log('Error chat:', error)
    const response = NextResponse.json(
      {
        error: 'internal error',
        response: 'Sorry, Something went wrong. Please try again later.',
      },
      { status: 500 }
    )
    return withResponseLogging(request, response)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const thread_id = searchParams.get('thread_id')
  const model_id = searchParams.get('model_id')

  if (thread_id) {
    // 校验 thread_id 是否为合法的 UUID
    if (!isUuid(thread_id)) {
      const response = NextResponse.json(
        { error: 'Invalid thread_id' },
        { status: 400 }
      )
      return withResponseLogging(request, response)
    }

    try {
      const modelId = typeof model_id === 'string' && model_id ? model_id : DEFAULT_MODEL_ID
      const app = await getApp(modelId)
      const state = await app.getState({
        configurable: { thread_id },
      })

      const history = state?.values?.messages || []
      if (Array.isArray(history) && history.length > 0) {
        const response = NextResponse.json({
          thread_id,
          history,
        })
        return withResponseLogging(request, response)
      }

      const session = getSession(thread_id)
      if (session?.type === 'testcase') {
        const qaChatbotApp = await getQaChatbotApp()
        const qaChatbotState = await qaChatbotApp.getState({ configurable: { thread_id } })
        const response = NextResponse.json({
          thread_id,
          history: qaChatbotState?.values?.messages || [],
        })
        return withResponseLogging(request, response)
      }

      const response = NextResponse.json({
        thread_id,
        history,
      })
      return withResponseLogging(request, response)
    } catch (e) {
      const response = NextResponse.json(
        {
          error: 'Get history failed',
          detail: String(e),
        },
        { status: 500 }
      )
      return withResponseLogging(request, response)
    }
  }
  const response = NextResponse.json({
    message: 'LangGraph chat api is running',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat - Stream chat messages',
      history: 'GET /api/chat?thread_id=xxx - Get chat history by thread_id',
    },
  })
  return withResponseLogging(request, response)
}
