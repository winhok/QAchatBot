import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface FeedbackButtonsProps {
  messageId: string
  sessionId: string
  className?: string
}

/**
 * 消息反馈按钮组件
 * 只在最后一条 AI 消息显示，点击后显示已选择状态
 */
export function FeedbackButtons({
  messageId,
  sessionId,
  className,
}: FeedbackButtonsProps): React.ReactElement {
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sendFeedback = async (score: number) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, sessionId, score }),
      })

      if (res.ok) {
        setFeedback(score === 1 ? 'good' : 'bad')
      } else {
        console.error('Failed to send feedback:', await res.text())
      }
    } catch (error) {
      console.error('Failed to send feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 已反馈：显示选中状态
  if (feedback) {
    return (
      <div className={cn('flex items-center gap-2 mt-2', className)}>
        {feedback === 'good' ? (
          <ThumbsUp className="h-4 w-4 fill-green-500 text-green-500" />
        ) : (
          <ThumbsDown className="h-4 w-4 fill-red-500 text-red-500" />
        )}
        <span className="text-xs text-muted-foreground">感谢反馈</span>
      </div>
    )
  }

  // 未反馈：显示按钮（hover 时才完全显示）
  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 mt-2 opacity-0 transition-opacity group-hover:opacity-100',
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isSubmitting}
              onClick={() => sendFeedback(1)}
              aria-label="好的回答"
            >
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            好的回答
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isSubmitting}
              onClick={() => sendFeedback(-1)}
              aria-label="需要改进"
            >
              <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            需要改进
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
