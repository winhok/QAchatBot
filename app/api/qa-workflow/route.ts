import { getQaWorkflowApp } from '@/app/agent/qa-workflow-agent'
import { HumanMessage } from '@langchain/core/messages'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import '../../utils/loadEnv'

export async function POST(request: NextRequest) {
  try {
    const { message, thread_id } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '请提供PRD需求内容' }, { status: 400 })
    }
    const userMessage = new HumanMessage(message)
    const threadId = typeof thread_id === 'string' && thread_id ? thread_id : randomUUID()
    const threadConfig = { configurable: { thread_id: threadId } }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const app = await getQaWorkflowApp()
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
          console.error('Error in QA workflow:', error)
          const errorData =
            JSON.stringify({
              type: 'error',
              status: 'internal error',
              message: 'QA工作流执行出错，请稍后重试',
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
    console.log('Error QA workflow:', error)
    return NextResponse.json({ error: 'QA工作流执行失败，请稍后重试' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const thread_id = searchParams.get('thread_id')
  if (thread_id) {
    try {
      const app = await getQaWorkflowApp()
      const state = await app.getState({ configurable: { thread_id } })
      return NextResponse.json({
        thread_id,
        history: state?.values?.messages || [],
      })
    } catch (e) {
      return NextResponse.json({ error: '获取历史记录失败', detail: String(e) }, { status: 500 })
    }
  }
  return NextResponse.json({
    message: 'QA智能体工作流 API',
    version: '1.0.0',
    description: '输入PRD需求，自动完成：测试点分析 → 用例生成 → 用例评审 → 输出高质量用例',
    endpoints: {
      workflow: 'POST /api/qa-workflow - 执行QA工作流',
      history: 'GET /api/qa-workflow?thread_id=xxx - 获取工作流历史',
    },
    workflow_stages: [
      '1. 测试点分析：从PRD中提取功能验证点、边界验证点、异常验证点',
      '2. 用例生成：基于测试点生成CSV格式测试用例，P0占比30%',
      '3. 用例评审：自动评审覆盖度、设计方法应用、质量标准',
    ],
  })
}
