import { createSession, deleteSession, getAllSessions, getSessionsByType, updateSessionName, type SessionType } from '@/app/agent/db'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as SessionType | null

    const sessions = type ? getSessionsByType(type) : getAllSessions()
    return NextResponse.json({ sessions })
  } catch (e) {
    return NextResponse.json(
      {
        error: 'Get sessions list failed',
        detail: String(e),
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type = 'normal' } = await request.json()
    const id = randomUUID()
    createSession(id, name || `新会话 - ${id.slice(0, 8)}`, type as SessionType)
    return NextResponse.json({ id, type })
  } catch (e) {
    return NextResponse.json(
      {
        error: 'create session failed',
        detail: String(e),
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        {
          error: 'Session ID is required',
        },
        {
          status: 400,
        }
      )
    }
    deleteSession(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      {
        error: 'delete session failed',
        detail: String(e),
      },
      {
        status: 500,
      }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name } = await request.json()
    if (!id || !name) {
      return NextResponse.json(
        {
          error: 'missing parameters',
        },
        {
          status: 400,
        }
      )
    }
    updateSessionName(id, name)
    return NextResponse.json({
      success: true,
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'update session name failed', detail: String(e) },
      {
        status: 500,
      }
    )
  }
}
