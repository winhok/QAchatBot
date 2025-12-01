import { create } from 'zustand'
import type { SessionState } from '../types/stores'
import { getOrCreateThreadId, setThreadId } from '../utils/threadId'

export const useSession = create<SessionState>((set, get) => ({
  sessionId: getOrCreateThreadId(),
  hasUserMessage: false,

  setSessionId: id => {
    setThreadId(id)
    set({ sessionId: id })
  },

  createNewSession: id => {
    setThreadId(id)
    set({ sessionId: id, hasUserMessage: false })
  },

  updateSessionName: async name => {
    if (get().hasUserMessage) return

    try {
      await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: get().sessionId,
          name: name.slice(0, 20),
        }),
      })
      set({ hasUserMessage: true })
    } catch (error) {
      console.error('更新会话名称失败:', error)
    }
  },

  resetHasUserMessage: () => set({ hasUserMessage: false }),
}))
