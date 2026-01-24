import { Check, Copy, Pencil, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Message } from '@/schemas'
import { ConnectedBranchSelector } from '@/components/message/ConnectedBranchSelector'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { cn } from '@/lib/utils'
import { extractTextContent } from '@/utils/message'

interface MessageActionProps {
  tooltip: string
  onClick: () => void
  children: ReactNode
  className?: string
}

export function MessageAction({ tooltip, onClick, children, className }: MessageActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn('size-7 text-muted-foreground hover:text-foreground', className)}
          aria-label={tooltip}
        >
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface MessageActionsProps {
  message: Message
  onEdit?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
}

export function MessageActions({ message, onEdit, onRegenerate }: MessageActionsProps) {
  const { copied, copy } = useCopyToClipboard()
  const isAssistant = message.role === 'assistant'
  const isUser = message.role === 'user'

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        role="toolbar"
        aria-label="消息操作"
      >
        {isAssistant && <ConnectedBranchSelector />}

        <MessageAction
          tooltip={copied ? '已复制' : '复制消息'}
          onClick={() => copy(extractTextContent(message.content))}
        >
          {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
        </MessageAction>

        {isUser && onEdit && (
          <MessageAction tooltip="编辑消息" onClick={() => onEdit(message.id)}>
            <Pencil className="size-4" />
          </MessageAction>
        )}

        {isAssistant && onRegenerate && (
          <MessageAction tooltip="重新生成" onClick={() => onRegenerate(message.id)}>
            <RefreshCw className="size-4" />
          </MessageAction>
        )}
      </div>
    </TooltipProvider>
  )
}
