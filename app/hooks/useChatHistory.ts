import { useEffect } from 'react'
import type { Message } from '../types/messages'

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

export function useChatHistory(sessionId: string, onLoadMessages: (messages: Message[]) => void, onHasUserMessage: (hasUser: boolean) => void) {
  const loadHistory = async (threadId: string) => {
    try {
      const res = await fetch(`/api/chat?thread_id=${threadId}`)
      const data = await res.json()

      if (Array.isArray(data.history) && data.history.length > 0) {
        const historyMsgs = transformMessages(data.history)
        onLoadMessages(historyMsgs)
        onHasUserMessage(historyMsgs.some(msg => msg.role === 'user'))
      } else {
        onLoadMessages([])
        onHasUserMessage(false)
      }
    } catch {
      onLoadMessages([])
      onHasUserMessage(false)
    }
  }

  useEffect(() => {
    loadHistory(sessionId)
  }, [sessionId])

  return { loadHistory }
}
