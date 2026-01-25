import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface ReasoningData {
  id: string
  checkpointId: string
  content: string
  duration: number | null
  createdAt: string
}

interface GetReasoningResponse {
  found: boolean
  data: ReasoningData | null
}

interface SessionReasoningsResponse {
  reasonings: Array<ReasoningData>
}

async function fetchReasoning(url: string): Promise<GetReasoningResponse> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch reasoning')
  }
  return res.json()
}

async function fetchSessionReasonings(url: string): Promise<SessionReasoningsResponse> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch session reasonings')
  }
  return res.json()
}

/**
 * 通过 checkpointId 获取 reasoning
 */
export function useReasoning(checkpointId: string | undefined) {
  const queryClient = useQueryClient()

  const { data, error, isLoading } = useQuery<GetReasoningResponse>({
    queryKey: ['reasoning', checkpointId],
    queryFn: () => fetchReasoning(`${API_BASE}/api/reasoning/${checkpointId}`),
    enabled: !!checkpointId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ['reasoning', checkpointId] })
  }

  return {
    reasoning: data?.found ? data.data : null,
    isLoading,
    error,
    invalidate,
  }
}

/**
 * 获取会话的所有 reasoning 记录
 */
export function useSessionReasonings(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  const { data, error, isLoading } = useQuery<SessionReasoningsResponse>({
    queryKey: ['session-reasonings', sessionId],
    queryFn: () => fetchSessionReasonings(`${API_BASE}/api/reasoning?sessionId=${sessionId}`),
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  })

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ['session-reasonings', sessionId] })
  }

  return {
    reasonings: data?.reasonings || [],
    isLoading,
    error,
    invalidate,
  }
}
