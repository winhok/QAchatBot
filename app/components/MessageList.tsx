'use client'

import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Bot } from 'lucide-react'
import { useChatMessages } from '@/app/stores/useChatMessages'
import { useSendMessage } from '@/app/stores/useSendMessage'
import { LoadingIndicator } from '@/app/components/LoadingIndicator'
import { MessageBubble } from '@/app/components/MessageBubble'
import { StopGenerationButton } from '@/app/components/StopGenerationButton'

export function MessageList() {
  const messages = useChatMessages(state => state.messages)
  const isLoading = useChatMessages(state => state.isLoading)
  const abortCurrent = useSendMessage(state => state.abortCurrent)

  if (messages.length === 0) {
    return <ScrollArea className='flex-1 px-4' />
  }

  return (
    <ScrollArea className='flex-1 px-4'>
      <div className='mx-auto max-w-3xl space-y-8 py-6'>
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className='flex gap-3'>
            <Avatar className='h-8 w-8 shrink-0 bg-linear-to-br from-emerald-500 to-teal-600'>
              <AvatarFallback className='bg-transparent'>
                <Bot className='h-4 w-4 text-white' />
              </AvatarFallback>
            </Avatar>
            <LoadingIndicator />
          </div>
        )}

        {/* 停止生成按钮 */}
        {isLoading && (
          <div className='flex justify-center py-2'>
            <StopGenerationButton onStop={abortCurrent} isGenerating={isLoading} />
          </div>
        )}

        <div ref={node => node?.scrollIntoView({ behavior: 'smooth' })} />
      </div>
    </ScrollArea>
  )
}
