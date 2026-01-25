'use client'

import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Message } from '@/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { extractTextContent } from '@/utils/message'

interface EditMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message?: Message
  onSubmit: (content: string, messageId: string) => void
}

export function EditMessageDialog({
  open,
  onOpenChange,
  message,
  onSubmit,
}: EditMessageDialogProps) {
  const [content, setContent] = useState('')

  // 打开对话框时，预填原消息内容
  useEffect(() => {
    if (open && message) {
      setContent(extractTextContent(message.content))
    }
  }, [open, message])

  const handleSubmit = () => {
    if (content.trim() && message) {
      onSubmit(content, message.id)
      setContent('')
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const originalContent = message ? extractTextContent(message.content) : ''
  const hasChanged = content.trim() !== originalContent.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            编辑消息
          </DialogTitle>
          <DialogDescription>修改消息后，AI 将根据新内容重新生成回复</DialogDescription>
        </DialogHeader>

        {/* 编辑消息 */}
        <div className="space-y-2">
          <Textarea
            placeholder="输入消息内容…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none"
            autoFocus
          />
          <span className="text-xs text-muted-foreground">按 Ctrl+Enter 或 ⌘+Enter 提交</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || !hasChanged}>
            保存并重新生成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
