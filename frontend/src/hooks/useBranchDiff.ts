import { useQuery } from '@tanstack/react-query'
import type { DiffResponse } from '@/services/git'
import { gitService } from '@/services/git'

/**
 * 获取两个分支的差异
 */
export function useBranchDiff(
  sessionId: string | undefined,
  checkpointA: string | undefined,
  checkpointB: string | undefined,
) {
  return useQuery<DiffResponse>({
    queryKey: ['branch-diff', sessionId, checkpointA, checkpointB],
    queryFn: async () => {
      if (!sessionId || !checkpointA || !checkpointB) {
        throw new Error('All parameters required')
      }
      return gitService.getDiff(sessionId, checkpointA, checkpointB)
    },
    enabled: !!sessionId && !!checkpointA && !!checkpointB,
    staleTime: 60000,
  })
}
