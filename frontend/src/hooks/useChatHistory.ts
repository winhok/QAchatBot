import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Message } from '@/schemas'
import { useChatStore } from '@/stores/chat'
import { useBranchStore } from '@/stores/useBranchStore'
import { useSession } from '@/stores/useSession'

/** LangGraph message structure */
interface LangGraphMessage {
  id: Array<string> | unknown
  kwargs?: {
    content?: string
    additional_kwargs?: {
      checkpoint_id?: string
      parent_checkpoint_id?: string
    }
    checkpoint_id?: string
    parent_checkpoint_id?: string
  }
}

interface HistoryResponse {
  history: Array<LangGraphMessage>
  checkpoint_id?: string
  parent_checkpoint_id?: string
}

/** Parse message role from LangGraph message ID */
function parseRole(msgId: unknown): 'user' | 'assistant' {
  if (!Array.isArray(msgId)) return 'assistant'
  if (msgId.includes('HumanMessage')) return 'user'
  return 'assistant'
}

/** Transform LangGraph messages to frontend Message format */
function transformMessages(history: Array<LangGraphMessage>): Array<Message> {
  return history.map((msg, idx) => ({
    id: String(idx + 1),
    content: msg.kwargs?.content || '',
    role: parseRole(msg.id),
    timestamp: new Date(),
    checkpointId: msg.kwargs?.additional_kwargs?.checkpoint_id || msg.kwargs?.checkpoint_id,
    parentCheckpointId:
      msg.kwargs?.additional_kwargs?.parent_checkpoint_id || msg.kwargs?.parent_checkpoint_id,
  }))
}

/** Fetch chat history from server */
async function fetchHistory(
  sessionId: string,
  checkpointId?: string,
): Promise<{ messages: Array<Message>; checkpointId?: string }> {
  const params = new URLSearchParams({ session_id: sessionId })
  if (checkpointId) {
    params.append('checkpoint_id', checkpointId)
  }

  const res = await fetch(`/api/chat?${params.toString()}`)
  const data = (await res.json()) as HistoryResponse

  return {
    messages:
      Array.isArray(data.history) && data.history.length > 0 ? transformMessages(data.history) : [],
    checkpointId: data.checkpoint_id,
  }
}

/** Load and manage chat history for a session */
export function useChatHistory({ threadId, enabled }: { threadId: string; enabled: boolean }) {
  const loadMessages = useChatStore((s) => s.loadMessages)
  const resetHasUserMessage = useSession((s) => s.resetHasUserMessage)
  const currentCheckpointId = useBranchStore((s) => s.currentCheckpointId)
  const setCurrentCheckpoint = useBranchStore((s) => s.setCurrentCheckpoint)
  const resetBranch = useBranchStore((s) => s.reset)
  const hasLoadedRef = useRef(false)

  const query = useQuery({
    queryKey: ['chatHistory', threadId, currentCheckpointId],
    queryFn: async () => {
      const result = await fetchHistory(threadId, currentCheckpointId)
      if (result.checkpointId && result.checkpointId !== currentCheckpointId) {
        setCurrentCheckpoint(result.checkpointId)
      }
      return result.messages
    },
    enabled: !!threadId && enabled,
    staleTime: Infinity,
    gcTime: 0,
  })

  const prevThreadIdRef = useRef<string | null>(null)

  // Reset state when switching sessions
  useEffect(() => {
    if (threadId !== prevThreadIdRef.current) {
      hasLoadedRef.current = false
      prevThreadIdRef.current = threadId
      resetBranch()
    }
  }, [threadId, resetBranch])

  useEffect(() => {
    if (query.data !== undefined && !hasLoadedRef.current && enabled) {
      loadMessages(query.data)
      resetHasUserMessage()
      hasLoadedRef.current = true
    }
  }, [enabled, loadMessages, query.data, resetHasUserMessage])

  return query
}
