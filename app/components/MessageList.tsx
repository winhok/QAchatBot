'use client'

import { ScrollArea } from '@/app/components/ui/scroll-area'
import { useChatMessages } from '../stores/useChatMessages'
import { LoadingIndicator } from './LoadingIndicator'
import { MessageBubble } from './MessageBubble'

export function MessageList() {
  const messages = useChatMessages(state => state.messages)
  const isLoading = useChatMessages(state => state.isLoading)

  return (
    <div className='flex-1 backdrop-blur-xl bg-slate-950/30 rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/5 overflow-hidden mb-4 min-h-0'>
      <ScrollArea className='h-full'>
        <div className='p-6 space-y-4 custom-scrollbar'>
          {messages.map((message, index) => (
            <MessageBubble key={message.id} message={message} index={index} />
          ))}

          {isLoading && <LoadingIndicator />}

          <div ref={node => node?.scrollIntoView({ behavior: 'smooth' })} />
        </div>
      </ScrollArea>
    </div>
  )
}
