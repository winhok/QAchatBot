import { GitBranch, PanelLeft, PanelLeftClose } from 'lucide-react'
import { useState } from 'react'
import { HideToolCallsToggle } from '@/components/chat/HideToolCallsToggle'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ConversationTree } from '@/components/git'
import { Button } from '@/components/ui/button'
import { usePanel } from '@/stores/usePanel'

interface ChatHeaderProps {
  sessionId?: string
}

export function ChatHeader({ sessionId }: ChatHeaderProps) {
  const sidebarCollapsed = usePanel((s) => s.sidebarCollapsed)
  const toggleSidebar = usePanel((s) => s.toggleSidebar)
  const [showTree, setShowTree] = useState(false)

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b-2 border-foreground bg-background px-4 sticky top-0 z-10">
        {/* 侧边栏切换按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 border-2 border-foreground hover:bg-muted"
          aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          {/* 对话树入口按钮 */}
          {sessionId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTree(true)}
              className="h-9 w-9 border-2 border-foreground hover:bg-muted"
              aria-label="对话树"
            >
              <GitBranch className="h-5 w-5" />
            </Button>
          )}

          {/* 隐藏工具调用切换 */}
          <HideToolCallsToggle />

          <ThemeToggle />
        </div>
      </header>

      {/* 对话树全屏视图 */}
      {showTree && sessionId && (
        <ConversationTree sessionId={sessionId} onClose={() => setShowTree(false)} />
      )}
    </>
  )
}
