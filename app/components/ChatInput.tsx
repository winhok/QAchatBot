'use client'

import type React from 'react'
import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu'
import { Paperclip, ArrowUp, FileCode, TestTube2, Bug, Plus, Sparkles } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

const quickActions = [
  { icon: FileCode, label: '测试接口', prompt: '帮我测试以下接口：' },
  { icon: TestTube2, label: '生成测试用例', prompt: '帮我生成以下功能的测试用例：' },
  { icon: Bug, label: '分析 Bug', prompt: '帮我分析以下错误日志：' },
]

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className='border-t border-border/50 bg-gradient-to-t from-background to-background/80 p-4 backdrop-blur-xl'>
      <div className='mx-auto max-w-3xl'>
        <div className='relative group'>
          {/* Glow Effect */}
          <div className='absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100' />

          {/* Input Container */}
          <div className='relative flex items-end gap-2 rounded-2xl border border-border/50 bg-card/80 p-2 shadow-lg backdrop-blur'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent h-10 w-10'
                >
                  <Plus className='h-5 w-5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-48'>
                {quickActions.map(action => (
                  <DropdownMenuItem key={action.label} onClick={() => setMessage(action.prompt)}>
                    <action.icon className='mr-2 h-4 w-4 text-emerald-400' />
                    {action.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Paperclip className='mr-2 h-4 w-4' />
                  上传文件
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='输入测试需求，让 AI 助手帮你完成...'
              className='min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent p-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-0'
              rows={1}
            />

            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              size='icon'
              className='shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105 disabled:opacity-50 disabled:shadow-none disabled:scale-100 h-10 w-10'
            >
              <ArrowUp className='h-5 w-5' />
            </Button>
          </div>
        </div>

        {/* Footer hint */}
        <div className='mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
          <Sparkles className='h-3 w-3 text-emerald-400' />
          <span>支持自然语言描述测试需求，AI 将自动调用相应工具执行</span>
        </div>
      </div>
    </div>
  )
}
