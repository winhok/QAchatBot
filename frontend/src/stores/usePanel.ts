import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PanelState {
  sidebarWidth: number
  sidebarCollapsed: boolean
  setSidebarWidth: (width: number) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const usePanel = create<PanelState>()(
  persist(
    (set) => ({
      sidebarWidth: 256,
      sidebarCollapsed: false,

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'panel-storage',
    },
  ),
)
