import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Message } from '@/schemas'
import { useChatMessages } from '@/stores/useChatMessages'
import { useSession } from '@/stores/useSession'

interface LangGraphMessage {
  id: Array<string> | unknown
  kwargs?: { content?: string }
}

function parseRole(msgId: unknown): 'user' | 'assistant' {
  if (!Array.isArray(msgId)) return 'assistant'
  if (msgId.includes('HumanMessage')) return 'user'
  return 'assistant'
}

function transformMessages(history: Array<LangGraphMessage>): Array<Message> {
  return history.map((msg, idx) => ({
    id: String(idx + 1),
    content: msg.kwargs?.content || '',
    role: parseRole(msg.id),
    timestamp: new Date(),
  }))
}

async function fetchHistory(sessionId: string): Promise<Array<Message>> {
  const res = await fetch(`/api/chat?session_id=${sessionId}`)
  const data = (await res.json()) as { history?: Array<LangGraphMessage> }
  if (Array.isArray(data.history) && data.history.length > 0) {
    return transformMessages(data.history)
  }
  return []
}

export function useChatHistory({
  threadId,
  enabled,
}: {
  threadId: string
  enabled: boolean
}) {
  const loadMessages = useChatMessages((s) => s.loadMessages)
  const resetHasUserMessage = useSession((s) => s.resetHasUserMessage)
  const hasLoadedRef = useRef(false)

  const query = useQuery({
    queryKey: ['chatHistory', threadId],
    queryFn: () => fetchHistory(threadId),
    enabled: !!threadId && enabled,
    staleTime: Infinity,
    gcTime: 0,
  })

  const prevThreadIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (threadId !== prevThreadIdRef.current) {
      hasLoadedRef.current = false
      prevThreadIdRef.current = threadId
    }
  }, [threadId])

  useEffect(() => {
    if (query.data !== undefined && !hasLoadedRef.current && enabled) {
      loadMessages(query.data)
      resetHasUserMessage()
      hasLoadedRef.current = true
    }
  }, [enabled, loadMessages, query.data, resetHasUserMessage])

  return query
}
