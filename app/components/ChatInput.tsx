'use client'

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
    <div className='backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-4 shrink-0'>
      <div className='flex items-end gap-4'>
        <div className='flex-1 relative input-focus-effect'>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder='输入你的消息... (支持 Shift+Enter 换行)'
            className='w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-sm input-scrollbar'
            rows={1}
            disabled={disabled}
            style={{ maxHeight: '120px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className='group p-3 bg-linear-to-r from-purple-500 to-cyan-500 text-white rounded-xl hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
        >
          <Send className='h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5' />
        </button>
      </div>

      <div className='flex items-center justify-between mt-3 text-xs text-purple-200'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='h-3 w-3' />
          <span>按 Enter 发送,Shift+Enter 换行</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
          <span>实时连接</span>
        </div>
      </div>
    </div>
  )
}
