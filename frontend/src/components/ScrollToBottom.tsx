import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScrollToBottomProps {
  /** 点击回调 */
  onClick: () => void
  /** 是否显示 */
  show: boolean
  /** 未读消息数量 */
  unreadCount?: number
  /** 自定义类名 */
  className?: string
}

export function ScrollToBottom({
  onClick,
  show,
  unreadCount = 0,
  className,
}: ScrollToBottomProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        'absolute bottom-4 left-1/2 -translate-x-1/2 z-10',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        className,
      )}
    >
      <Button
        onClick={onClick}
        size="sm"
        variant="secondary"
        className={cn(
          'rounded-full shadow-lg',
          'bg-background/90 backdrop-blur-sm border border-border/50',
          'hover:bg-background hover:shadow-xl',
          'transition-all duration-200',
          'gap-1.5 px-3 h-8',
        )}
      >
        <ArrowDown className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="text-xs font-medium">
            {unreadCount > 99 ? '99+' : unreadCount} 条新消息
          </span>
        ) : (
          <span className="text-xs">滚动到底部</span>
        )}
      </Button>
    </div>
  )
}
