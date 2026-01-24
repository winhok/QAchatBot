import { BranchSelector } from '@/components/message/BranchSelector'
import { useBranches } from '@/hooks/useBranches'
import { useBranchStore } from '@/stores/useBranchStore'
import { useSession } from '@/stores/useSession'

/**
 * 连接到 useBranches hook 的分支选择器
 * 用于在消息旁边显示分支导航 (1/2, 2/2)
 */
export function ConnectedBranchSelector() {
  const sessionId = useSession((s) => s.sessionId)
  const { data, isLoading } = useBranches(sessionId || '')
  const setCurrentCheckpoint = useBranchStore((s) => s.setCurrentCheckpoint)

  if (isLoading || !data || data.total <= 1) {
    return null
  }

  const handlePrev = () => {
    const prevIndex = Math.max(0, data.currentIndex - 1)
    setCurrentCheckpoint(data.branches[prevIndex].checkpointId)
  }

  const handleNext = () => {
    const nextIndex = Math.min(data.total - 1, data.currentIndex + 1)
    setCurrentCheckpoint(data.branches[nextIndex].checkpointId)
  }

  return (
    <BranchSelector
      currentIndex={data.currentIndex}
      total={data.total}
      onPrev={handlePrev}
      onNext={handleNext}
    />
  )
}
