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
    const threadId = typeof thread_id === 'string' && thread_id ? thread_id : randomUUID
    const threadConfig = { configurable: { thread_id: threadId } }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const app = await getApp()
          for await (const event of app.streamEvents({ messages: [userMessage] }, { version: 'v2', ...threadConfig })) {
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
          console.error('Error streaming chat:', error)
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
