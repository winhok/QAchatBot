import { AnimatePresence, motion } from 'framer-motion'
import { Brain, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Shimmer } from '@/components/common/shimmer'

export interface ReasoningProps {
  /** 是否正在流式接收 reasoning */
  isStreaming?: boolean
  /** reasoning 内容 */
  content: string
  /** 思考时长（ms），流式完成后设置 */
  duration?: number
  /** 额外的 className */
  className?: string
}

/**
 * Reasoning 思考过程展示组件
 *
 * - 流式接收时自动展开，显示 shimmer 效果
 * - 完成后自动收起
 * - 点击可展开/收起查看详情
 */
export function Reasoning({ isStreaming = false, content, duration, className }: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 流式接收时自动展开
  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true)
    }
  }, [isStreaming])

  // 流式结束后延迟收起
  useEffect(() => {
    if (!isStreaming && isExpanded && content) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, isExpanded, content])

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000)
    return `${seconds}s`
  }

  if (!content && !isStreaming) {
    return null
  }

  return (
    <div className={cn('rounded-lg border border-border/50 overflow-hidden', className)}>
      {/* Header - 可点击展开/收起 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-sm',
          'hover:bg-accent/50 transition-colors cursor-pointer',
          'text-muted-foreground',
        )}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? '收起思考过程' : '展开思考过程'}
      >
        <Brain className="size-4" />
        {isStreaming ? (
          <Shimmer>思考中...</Shimmer>
        ) : (
          <span>已思考 {duration ? formatDuration(duration) : ''}</span>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronDown className="size-4" />
        </motion.div>
      </button>

      {/* Content - 可折叠 */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 bg-muted/30 p-3">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono max-h-64 overflow-y-auto">
                {content}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse" />
                )}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
