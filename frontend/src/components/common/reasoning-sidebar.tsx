import { AnimatePresence, motion } from 'framer-motion'
import { Brain, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ReasoningSidebarProps {
  /** 是否打开 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
  /** reasoning 内容 */
  content: string
  /** 思考时长（ms） */
  duration?: number
  /** 额外的 className */
  className?: string
}

/**
 * Reasoning 侧边栏
 *
 * 类似 GPT 的设计，点击"已思考 Xs"后在右侧打开侧边栏展示完整思考过程
 */
export function ReasoningSidebar({
  isOpen,
  onClose,
  content,
  duration,
  className,
}: ReasoningSidebarProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000)
    return `${seconds}秒`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-full max-w-md',
              'flex flex-col bg-background border-l border-border shadow-xl',
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Brain className="size-5 text-muted-foreground" />
                <h2 className="font-semibold">思考过程</h2>
                {duration && (
                  <span className="text-sm text-muted-foreground">
                    · {formatDuration(duration)}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭侧边栏">
                <X className="size-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm text-foreground/80 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {content || '暂无思考内容'}
              </pre>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
