import SessionSidebar from '@/components/SessionSidebar'
import { CanvasSidebar } from '@/components/canvas/CanvasSidebar'
import { useArtifactParsing } from '@/hooks/useArtifactParsing'; // We will create this hook next
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

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
  // Global artifact parsing listener
  useArtifactParsing()

  return (
    <div className="flex h-screen bg-background">
      <SessionSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <CanvasSidebar />
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
