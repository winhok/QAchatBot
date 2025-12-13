'use client'

import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { Bot } from 'lucide-react'
import { useChatMessages } from '../stores/useChatMessages'
import { LoadingIndicator } from './LoadingIndicator'
import { MessageBubble } from './MessageBubble'

export function MessageList() {
  const messages = useChatMessages(state => state.messages)
  const isLoading = useChatMessages(state => state.isLoading)

  return (
    <ScrollArea className='flex-1 px-4'>
      <div className='mx-auto max-w-3xl space-y-6 py-6'>
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className='flex gap-3'>
            <Avatar className='h-8 w-8 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600'>
              <AvatarFallback className='bg-transparent'>
                <Bot className='h-4 w-4 text-white' />
              </AvatarFallback>
            </Avatar>
            <LoadingIndicator />
          </div>
        )}

        <div ref={node => node?.scrollIntoView({ behavior: 'smooth' })} />
      </div>
    </ScrollArea>
  )
}
