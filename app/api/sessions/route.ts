import { createSession, deleteSession, getAllSessions, getSessionsByType, updateSessionName } from '@/app/agent/db'
import {
  CreateSessionRequestSchema,
  DeleteSessionRequestSchema,
  SessionTypeSchema,
  UpdateSessionRequestSchema,
} from '@/app/schemas'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

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
    headers: new Headers({
      ...Object.fromEntries(response.headers.entries()),
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')

    // 使用 Zod 验证 type 参数
    const type = typeParam ? SessionTypeSchema.safeParse(typeParam) : null

    const sessions = type?.success ? getSessionsByType(type.data) : getAllSessions()
    const response = NextResponse.json({ sessions })
    return withResponseLogging(request, response)
  } catch (e) {
    const response = NextResponse.json(
      {
        error: 'Get sessions list failed',
        detail: String(e),
      },
      {
        status: 500,
      }
    )
    return withResponseLogging(request, response)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 使用 Zod 验证请求体
    const result = CreateSessionRequestSchema.safeParse(body)
    if (!result.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
      return withResponseLogging(request, response)
    }

    const { name, type } = result.data
    const id = randomUUID()
    createSession(id, name || `新会话 - ${id.slice(0, 8)}`, type)
    const response = NextResponse.json({ id, type })
    return withResponseLogging(request, response)
  } catch (e) {
    const response = NextResponse.json(
      {
        error: 'create session failed',
        detail: String(e),
      },
      {
        status: 500,
      }
    )
    return withResponseLogging(request, response)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    // 使用 Zod 验证请求体
    const result = DeleteSessionRequestSchema.safeParse(body)
    if (!result.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
      return withResponseLogging(request, response)
    }

    deleteSession(result.data.id)
    const response = NextResponse.json({ success: true })
    return withResponseLogging(request, response)
  } catch (e) {
    const response = NextResponse.json(
      {
        error: 'delete session failed',
        detail: String(e),
      },
      {
        status: 500,
      }
    )
    return withResponseLogging(request, response)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    // 使用 Zod 验证请求体
    const result = UpdateSessionRequestSchema.safeParse(body)
    if (!result.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
      return withResponseLogging(request, response)
    }

    const { id, name, type } = result.data
    updateSessionName(id, name, type)
    const response = NextResponse.json({ success: true })
    return withResponseLogging(request, response)
  } catch (e) {
    const response = NextResponse.json(
      { error: 'update session name failed', detail: String(e) },
      {
        status: 500,
      }
    )
    return withResponseLogging(request, response)
  }
}
