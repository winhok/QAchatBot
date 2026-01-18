import { PanelLeft, PanelLeftClose } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { usePanel } from '@/stores/usePanel'

export function ChatHeader() {
  const sidebarCollapsed = usePanel((s) => s.sidebarCollapsed)
  const toggleSidebar = usePanel((s) => s.toggleSidebar)

  return (
    <header className="flex h-14 items-center justify-between border-b-2 border-foreground bg-background px-4 sticky top-0 z-10">
      {/* 侧边栏切换按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 border-2 border-foreground hover:bg-muted"
        title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {sidebarCollapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <ThemeToggle />
    </header>
  )
}
