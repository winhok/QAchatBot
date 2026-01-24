import { Check, Copy, Pencil, RefreshCw } from 'lucide-react'
import type { Message } from '@/schemas'
import { ConnectedBranchSelector } from '@/components/message/ConnectedBranchSelector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { extractTextContent } from '@/utils/message'

interface MessageActionsProps {
  message: Message
  onEdit?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
}

export function MessageActions({ message, onEdit, onRegenerate }: MessageActionsProps) {
  const { copied, copy } = useCopyToClipboard()

  const handleCopy = () => {
    copy(extractTextContent(message.content))
  }

  const handleEdit = () => {
    onEdit?.(message.id)
  }

  const handleRegenerate = () => {
    onRegenerate?.(message.id)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 分支选择器 - 仅 assistant 消息显示 */}
        {message.role === 'assistant' && <ConnectedBranchSelector />}

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

        {/* 编辑按钮 - 仅 user 消息显示 */}
        {message.role === 'user' && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>编辑消息</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 重新生成按钮 - 仅 assistant 消息显示 */}
        {message.role === 'assistant' && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRegenerate}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>重新生成</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
