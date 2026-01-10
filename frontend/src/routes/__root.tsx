import { TanStackDevtools } from '@tanstack/react-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SearchDialog } from '@/components/SearchDialog'
import SessionSidebar from '@/components/SessionSidebar'
import { CanvasSidebar } from '@/components/canvas/CanvasSidebar'
import { useRegisterGlobalHotkeys } from '@/hooks'
import { useArtifactParsing } from '@/hooks/useArtifactParsing'
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">页面未找到</p>
      </div>
    </div>
  )
}

function RootComponent() {
  // 搜索对话框状态
  const [searchOpen, setSearchOpen] = useState(false)
  // 侧边栏折叠状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 全局 artifact 解析监听
  useArtifactParsing()

  // 注册全局热键
  useRegisterGlobalHotkeys({
    onSearchOpen: () => setSearchOpen(true),
    onToggleSidebar: () => setSidebarCollapsed((prev) => !prev),
  })

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 - 支持折叠 (仅在登录后显示) */}
      <ProtectedRoute>
        {!sidebarCollapsed && <SessionSidebar />}

        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>

        <CanvasSidebar />

        {/* 搜索对话框 */}
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </ProtectedRoute>

      {import.meta.env.DEV && (
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
            TanStackQueryDevtools,
          ]}
        />
      )}
    </div>
  )
}
