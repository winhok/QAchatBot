import { Check, Copy, GitFork } from 'lucide-react'
import type { Message } from '@/schemas'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { extractTextContent } from '@/utils/message'

interface MessageActionsProps {
  message: Message
  onFork?: (messageId: string) => void
}

export function MessageActions({ message, onFork }: MessageActionsProps) {
  const { copied, copy } = useCopyToClipboard()

  const handleCopy = () => {
    copy(extractTextContent(message.content))
  }

  const handleFork = () => {
    onFork?.(message.id)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{copied ? '已复制' : '复制消息'}</p>
          </TooltipContent>
        </Tooltip>

        {/* 分叉按钮 - 仅 assistant 消息显示 */}
        {message.role === 'assistant' && onFork && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleFork}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <GitFork className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>从此分叉</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
