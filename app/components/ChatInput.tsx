'use client'

import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { cn } from '@/app/lib/utils'
import { MessageCircle, Send } from 'lucide-react'
import { useRef, useState } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const handleSend = () => {
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustHeight(e.target)
  }

  return (
    <div className='backdrop-blur-xl bg-slate-950/40 rounded-2xl border border-white/10 shadow-2xl shadow-purple-500/10 p-4 shrink-0'>
      <div className='flex items-end gap-4'>
        <div className='flex-1 relative'>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder='输入你的消息... (支持 Shift+Enter 换行)'
            className={cn(
              'min-h-[44px] bg-white/5 border-white/20 rounded-xl px-4 py-3',
              'text-white placeholder:text-purple-300/50 resize-none',
              'focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50',
              'backdrop-blur-sm transition-all duration-200 text-sm input-scrollbar',
              'shadow-inner shadow-black/20'
            )}
            rows={1}
            disabled={disabled}
            style={{ maxHeight: '120px' }}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          size='icon'
          className={cn(
            'h-[44px] w-[44px] shrink-0',
            'bg-linear-to-r from-purple-500 to-pink-500',
            'hover:from-purple-600 hover:to-pink-600',
            'shadow-lg shadow-purple-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105',
            'active:scale-95'
          )}
        >
          <Send className='h-5 w-5' />
        </Button>
      </div>

      <div className='flex items-center justify-between mt-3 text-xs text-purple-300/60'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='h-3 w-3' />
          <span>按 Enter 发送,Shift+Enter 换行</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]' />
          <span>实时连接</span>
        </div>
      </div>
    </div>
  )
}
