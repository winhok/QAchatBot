'use client'

import { RefreshCw } from 'lucide-react'
import type { Message } from '@/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { extractTextContent } from '@/utils/message'

interface RegenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message?: Message
  onConfirm: (messageId: string) => void
}

export function RegenerateDialog({
  open,
  onOpenChange,
  message,
  onConfirm,
}: RegenerateDialogProps) {
  const handleConfirm = () => {
    if (message) {
      onConfirm(message.id)
      onOpenChange(false)
    }
  }

  const originalContent = message ? extractTextContent(message.content) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            重新生成回复
          </DialogTitle>
          <DialogDescription>AI 将根据相同的用户消息重新生成一个不同的回复</DialogDescription>
        </DialogHeader>

        {/* AI 消息预览 */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">当前 AI 回复</span>
          <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
            {originalContent.length > 300
              ? originalContent.slice(0, 300) + '...'
              : originalContent || '(无文本内容)'}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>重新生成</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
