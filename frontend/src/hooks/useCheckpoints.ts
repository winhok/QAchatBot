import { useQuery } from '@tanstack/react-query'
import type { CheckpointInfo } from '@/schemas'

/**
 * 获取会话的 checkpoint 历史列表 (LangGraph Time Travel)
 */
export function useCheckpoints(sessionId: string | null) {
  return useQuery({
    queryKey: ['checkpoints', sessionId],
    queryFn: async (): Promise<Array<CheckpointInfo>> => {
      if (!sessionId) return []

      const res = await fetch(`/api/chat/${sessionId}/checkpoints`)
      if (!res.ok) {
        throw new Error('Failed to fetch checkpoints')
      }
      return res.json()
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 秒内不重新请求
  })
}
