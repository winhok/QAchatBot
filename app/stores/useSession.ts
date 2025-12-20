import { create } from 'zustand'
import type { SessionState, SessionType } from '@/app/types/stores'
import { DEFAULT_MODEL_ID } from '@/app/config/models'

export const useSession = create<SessionState>((set, get) => ({
  sessionId: '',
  sessionType: 'normal' as SessionType,
  modelId: DEFAULT_MODEL_ID,
  hasUserMessage: false,
  welcomeRefreshTrigger: 0,
  renameId: null,
  renameValue: '',

  setSessionId: id => {
    set({ sessionId: id })
  },

  setSessionType: type => {
    set({ sessionType: type })
  },

  setModelId: modelId => {
    set({ modelId })
  },

  refreshWelcome: () => {
    set(state => ({ welcomeRefreshTrigger: state.welcomeRefreshTrigger + 1 }))
  },

  createNewSession: (id, type = 'normal') => {
    set({ sessionId: id, sessionType: type, hasUserMessage: false })
  },

  updateSessionName: async name => {
    if (get().hasUserMessage) return

    try {
      await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: get().sessionId,
          name: name.slice(0, 20),
          type: get().sessionType,
        }),
      })
      set({ hasUserMessage: true })
    } catch (error) {
      console.error('更新会话名称失败:', error)
    }
  },

  resetHasUserMessage: () => set({ hasUserMessage: false }),

  setRenameId: id => set({ renameId: id }),
  setRenameValue: value => set({ renameValue: value }),
  openRenameModal: (id, name) => set({ renameId: id, renameValue: name }),
  closeRenameModal: () => set({ renameId: null, renameValue: '' }),
}))
