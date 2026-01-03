import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'

/**
 * 用户信息区域组件
 * 显示当前登录用户信息和登出按钮
 */
export function UserSection() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user.email}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
        title="登出"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
