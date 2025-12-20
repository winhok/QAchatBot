'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useChatMessages } from '@/app/stores/useChatMessages'
import { useSession } from '@/app/stores/useSession'
import type { Message } from '@/app/types/messages'

interface LangGraphMessage {
  id: string[] | unknown
  kwargs?: { content?: string }
}

function parseRole(msgId: unknown): 'user' | 'assistant' {
  if (!Array.isArray(msgId)) return 'assistant'
  if (msgId.includes('HumanMessage')) return 'user'
  return 'assistant'
}

function transformMessages(history: LangGraphMessage[]): Message[] {
  return history.map((msg, idx) => ({
    id: String(idx + 1),
    content: msg.kwargs?.content || '',
    role: parseRole(msg.id),
    timestamp: new Date(),
  }))
}

async function fetchHistory(sessionId: string): Promise<Message[]> {
  const res = await fetch(`/api/chat?thread_id=${sessionId}`)
  const data = (await res.json()) as { history?: LangGraphMessage[] }
  if (Array.isArray(data.history) && data.history.length > 0) {
    return transformMessages(data.history)
  }
  return []
}

export function useChatHistory({ threadId, enabled }: { threadId: string; enabled: boolean }) {
  const loadMessages = useChatMessages(s => s.loadMessages)
  const resetHasUserMessage = useSession(s => s.resetHasUserMessage)
  const hasLoadedRef = useRef(false)

  const query = useQuery({
    queryKey: ['chatHistory', threadId],
    queryFn: () => fetchHistory(threadId),
    enabled: !!threadId && enabled,
    staleTime: Infinity,
    gcTime: 0,
  })

  useEffect(() => {
    hasLoadedRef.current = false
  }, [threadId])

  useEffect(() => {
    if (query.data && !hasLoadedRef.current && enabled) {
      loadMessages(query.data)
      resetHasUserMessage()
      hasLoadedRef.current = true
    }
  }, [enabled, loadMessages, query.data, resetHasUserMessage])

  return query
}
