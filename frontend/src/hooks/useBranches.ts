import { useQuery } from '@tanstack/react-query'
import { useBranchStore } from '@/stores/useBranchStore'

interface Branch {
  checkpointId: string
  preview: string
  createdAt: string
  isCurrent: boolean
}

interface BranchesResponse {
  branches: Array<Branch>
  currentIndex: number
  total: number
}

/**
 * 获取指定 checkpoint 的同级分支列表
 * 用于实现 LobeChat 风格的分支选择器
 */
export function useBranches(sessionId: string) {
  const currentCheckpointId = useBranchStore((s) => s.currentCheckpointId)

  return useQuery<BranchesResponse | null>({
    queryKey: ['branches', sessionId, currentCheckpointId],
    queryFn: async () => {
      if (!currentCheckpointId) return null

      const res = await fetch(
        `/api/chat/${sessionId}/branches?checkpoint_id=${encodeURIComponent(currentCheckpointId)}`,
      )

      if (!res.ok) {
        throw new Error('Failed to fetch branches')
      }

      return res.json()
    },
    enabled: !!sessionId && !!currentCheckpointId,
    staleTime: 30000, // 30s cache
  })
}
