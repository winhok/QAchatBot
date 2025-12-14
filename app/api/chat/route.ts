import { getApp } from '@/app/agent/chatbot'
import { HumanMessage } from '@langchain/core/messages'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import '../../utils/loadEnv'

export async function POST(request: NextRequest) {
  try {
    const { message, thread_id } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid messages format',
        },
        { status: 400 }
      )
    }
    const userMessage = new HumanMessage(message)
    const threadId = typeof thread_id === 'string' && thread_id ? thread_id : randomUUID()
    const threadConfig = { configurable: { thread_id: threadId } }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const app = await getApp()
          const toolCallsMap = new Map<string, { name: string; startTime: number }>()

          for await (const event of app.streamEvents({ messages: [userMessage] }, { version: 'v2', ...threadConfig })) {
            // 处理模型流式输出
            if (event.event === 'on_chat_model_stream') {
              const chunk = event.data?.chunk
              if (chunk?.content) {
                const data =
                  JSON.stringify({
                    type: 'chunk',
                    content: chunk.content,
                  }) + '\n'
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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.log('Error chat:', error)
    return NextResponse.json(
      {
        error: 'internal error',
        response: 'Sorry, Something went wrong. Please try again later.',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const thread_id = searchParams.get('thread_id')
  if (thread_id) {
    try {
      const app = await getApp()
      const state = await app.getState({
        configurable: { thread_id },
      })
      return NextResponse.json({
        thread_id,
        history: state?.values?.messages || [],
      })
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Get history failed',
          detail: String(e),
        },
        { status: 500 }
      )
    }
  }
  return NextResponse.json({
    message: 'LangGraph chat api is running',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat - Stream chat messages',
      history: 'GET /api/chat?thread_id=xxx - Get chat history by thread_id',
    },
  })
}
