import { useQuery } from '@tanstack/react-query'

/**
 * 获取会话的分支数量
 * 用于侧边栏显示分支徽章
 */
export function useBranchCount(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['branchCount', sessionId],
    queryFn: async () => {
      if (!sessionId) return 1

      const res = await fetch(`/api/chat/${sessionId}/branch-count`)
      if (!res.ok) {
        console.warn('[useBranchCount] Failed to fetch branch count')
        return 1
      }

      const data = await res.json()
      return data.branchCount ?? 1
    },
    enabled: !!sessionId,
    staleTime: 30_000, // 30 秒内不重新请求
    gcTime: 60_000,
  })
}
