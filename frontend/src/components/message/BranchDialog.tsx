'use client'

import { GitFork } from 'lucide-react'
import { useState } from 'react'
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

interface BranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message?: Message
  onSubmit: (content: string, checkpointId: string) => void
}

export function BranchDialog({ open, onOpenChange, message, onSubmit }: BranchDialogProps) {
  const [content, setContent] = useState('')

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" />
            从此消息创建分支
          </DialogTitle>
          <DialogDescription>基于此消息的上下文创建新的对话分支</DialogDescription>
        </DialogHeader>

        {/* 原消息预览 */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">原消息</span>
          <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
            {originalContent.length > 200
              ? originalContent.slice(0, 200) + '...'
              : originalContent || '(无文本内容)'}
          </div>
        </div>

        {/* 新消息输入 */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">新消息</span>
          <Textarea
            placeholder="输入新的消息内容…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] resize-none"
            autoFocus
          />
          <span className="text-xs text-muted-foreground">按 Ctrl+Enter 或 ⌘+Enter 提交</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim()}>
            创建分支
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
