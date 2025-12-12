'use client'

import { Bot, User } from 'lucide-react'
import { Message } from '../types/messages'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MessageBubbleProps {
  message: Message
  index: number
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-4 opacity-0 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
      style={{
        animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`,
      }}
    >
      <div className='shrink-0'>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-transparent ${
            message.role === 'user'
              ? 'bg-linear-to-br from-blue-500 to-cyan-500 ring-blue-400/30'
              : 'bg-linear-to-br from-purple-500 to-pink-500 ring-purple-400/30'
          }`}
        >
          {message.role === 'user' ? <User className='h-5 w-5 text-white' /> : <Bot className='h-5 w-5 text-white' />}
        </div>
      </div>

      <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <div
          className={`relative inline-block p-4 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-200 ${
            message.role === 'user'
              ? 'bg-linear-to-br from-blue-500/90 to-cyan-500/90 text-white border-white/20 rounded-br-md'
              : 'bg-white/10 text-white border-white/20 rounded-bl-md'
          }`}
        >
          <div className='text-sm leading-relaxed'>
            <MarkdownRenderer content={message.content} />
          </div>

          {message.isStreaming && <span className='inline-block w-2 h-5 bg-white ml-1 typing-cursor'></span>}
        </div>

        <div className={`mt-2 text-xs text-purple-200 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
