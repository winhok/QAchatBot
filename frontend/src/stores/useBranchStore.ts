import { create } from 'zustand'

interface BranchState {
  /** 当前所在分支的 checkpoint ID */
  currentCheckpointId: string | undefined

  /** 设置当前分支 */
  setCurrentCheckpoint: (id: string | undefined) => void

  /** 重置（切换会话时） */
  reset: () => void
}

export const useBranchStore = create<BranchState>((set) => ({
  currentCheckpointId: undefined,

  setCurrentCheckpoint: (id) => set({ currentCheckpointId: id }),

  reset: () => set({ currentCheckpointId: undefined }),
}))
