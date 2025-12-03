import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PanelState {
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
}

export const usePanel = create<PanelState>()(
  persist(
    set => ({
      sidebarWidth: 320,
      setSidebarWidth: width => set({ sidebarWidth: width }),
    }),
    {
      name: 'panel-storage',
    }
  )
)
