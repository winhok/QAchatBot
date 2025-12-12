'use client'

import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { cn } from '@/app/lib/utils'
import { Bot, User } from 'lucide-react'
import { Message } from '../types/messages'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar
        className={cn(
          'h-8 w-8 shrink-0',
          !isUser ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-muted'
        )}
      >
        <AvatarFallback className='bg-transparent'>
          {isUser ? (
            <User className='h-4 w-4 text-muted-foreground' />
          ) : (
            <Bot className='h-4 w-4 text-white' />
          )}
        </AvatarFallback>
      </Avatar>
      <div className={cn('max-w-[85%] space-y-3', isUser && 'flex flex-col items-end')}>
        {message.content && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            )}
          >
            <div className='text-sm leading-relaxed'>
              <MarkdownRenderer content={message.content} />
            </div>
            {message.isStreaming && <span className='inline-block w-2 h-4 bg-current ml-1 typing-cursor'></span>}
          </div>
        )}
      </div>
    </div>
  )
}
