'use client'

import { Bot, User } from 'lucide-react'
import { Message } from '../types/messages'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  index: number
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        'flex gap-4 opacity-0',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      style={{
        animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`,
      }}
    >
      {/* Avatar */}
      <div className='shrink-0'>
        <Avatar className={cn(
          'w-10 h-10 rounded-2xl shadow-lg',
          isUser 
            ? 'shadow-cyan-500/30' 
            : 'shadow-purple-500/30'
        )}>
          <AvatarFallback className={cn(
            'rounded-2xl',
            isUser
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
              : 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600'
          )}>
            {isUser ? (
              <User className='h-5 w-5 text-white' />
            ) : (
              <Bot className='h-5 w-5 text-white' />
            )}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn('max-w-[75%]', isUser ? 'text-right' : 'text-left')}>
        <Card
          className={cn(
            'inline-block backdrop-blur-lg shadow-xl border',
            'transition-all duration-200',
            isUser
              ? cn(
                  'bg-gradient-to-br from-cyan-500/80 to-blue-600/80',
                  'border-white/20 rounded-2xl rounded-br-md',
                  'shadow-cyan-500/20 text-white'
                )
              : cn(
                  'bg-slate-950/60 border-white/10 rounded-2xl rounded-bl-md',
                  'shadow-purple-500/10 text-white'
                )
          )}
        >
          <div className='p-4 text-sm leading-relaxed'>
            <MarkdownRenderer content={message.content} />
            {message.isStreaming && (
              <span className='inline-block w-2 h-5 bg-white ml-1 typing-cursor'></span>
            )}
          </div>
        </Card>

        {/* Timestamp */}
        <div className={cn(
          'mt-2 text-xs text-purple-300/50',
          isUser ? 'text-right' : 'text-left'
        )}>
          {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
