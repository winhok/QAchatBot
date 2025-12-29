import { create } from 'zustand'
import type { SessionState, SessionType } from '@/types/stores'
import { DEFAULT_MODEL_ID } from '@/config/models'

export const useSession = create<SessionState>((set) => ({
  sessionId: '',
  sessionType: 'normal' as SessionType,
  modelId: DEFAULT_MODEL_ID,
  hasUserMessage: false,
  hasModeSelected: false,
  welcomeRefreshTrigger: 0,
  renameId: null,
  renameValue: '',

  setSessionId: (id) => {
    set({ sessionId: id })
  },

  setSessionType: (type) => {
    set({ sessionType: type })
  },

  setModelId: (modelId) => {
    set({ modelId })
  },

  setHasModeSelected: (selected) => {
    set({ hasModeSelected: selected })
  },

  refreshWelcome: () => {
    set((state) => ({ welcomeRefreshTrigger: state.welcomeRefreshTrigger + 1 }))
  },

  createNewSession: (id, type = 'normal') => {
    set({ sessionId: id, sessionType: type, hasUserMessage: false })
  },

  setHasUserMessage: (hasUserMessage: boolean) => set({ hasUserMessage }),

  resetHasUserMessage: () => set({ hasUserMessage: false }),

  setRenameId: (id) => set({ renameId: id }),
  setRenameValue: (value) => set({ renameValue: value }),
  openRenameModal: (id, name) => set({ renameId: id, renameValue: name }),
  closeRenameModal: () => set({ renameId: null, renameValue: '' }),
}))
