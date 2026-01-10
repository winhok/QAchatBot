import { Bell, MessageSquare, Settings, TestTube2, Wrench } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TOOLS } from '@/lib/constants'
import { useSession } from '@/stores/useSession'

const SESSION_TYPE_CONFIG = {
  normal: {
    label: '普通聊天',
    icon: MessageSquare,
    variant: 'success' as const,
  },
  testcase: {
    label: '测试设计',
    icon: TestTube2,
    variant: 'teal' as const,
  },
}

export function ChatHeader() {
  const sessionType = useSession((s) => s.sessionType)
  const sessionId = useSession((s) => s.sessionId)
  const enabledToolsCount = TOOLS.filter((t) => t.enabled).length

  const config = SESSION_TYPE_CONFIG[sessionType]
  const TypeIcon = config.icon

  const handleNotifications = () => {
    // TODO: Implement notifications feature
    console.log('Notifications feature coming soon')
  }

  const handleSettings = () => {
    // TODO: Implement settings feature
    console.log('Settings feature coming soon')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {sessionId && (
          <Badge variant={config.variant} className="gap-1.5">
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        )}

        {/* Tools Indicator */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground rounded-xl h-9"
            >
              <div className="relative">
                <Wrench className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {enabledToolsCount}
                </span>
              </div>
              <span className="text-sm">工具</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              已启用工具
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TOOLS.map((tool) => (
              <DropdownMenuItem key={tool.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-lg p-1.5 ${tool.enabled ? 'bg-emerald-500/10' : 'bg-muted'}`}
                  >
                    <tool.icon
                      className={`h-4 w-4 ${tool.enabled ? 'text-emerald-400' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <span>{tool.name}</span>
                </div>
                <div
                  className={`h-2 w-2 rounded-full ${tool.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNotifications}
          aria-label="通知 - 您有未读通知"
          className="text-muted-foreground hover:text-foreground relative rounded-xl h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSettings}
          aria-label="设置"
          className="text-muted-foreground hover:text-foreground rounded-xl h-9 w-9"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
