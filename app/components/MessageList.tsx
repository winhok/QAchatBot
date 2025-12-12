'use client'

import { useChatMessages } from '../stores/useChatMessages'
import { LoadingIndicator } from './LoadingIndicator'
import { MessageBubble } from './MessageBubble'
import { WelcomeScreen } from './WelcomeScreen'

interface MessageListProps {
  onFeatureClick?: (prompt: string) => void
}

export function MessageList({ onFeatureClick }: MessageListProps) {
  const messages = useChatMessages(state => state.messages)
  const isLoading = useChatMessages(state => state.isLoading)

  return (
    <div className='flex-1 backdrop-blur-md bg-white/5 rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-4 min-h-0'>
      <div className='h-full overflow-y-auto p-6 space-y-4 custom-scrollbar'>
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen onFeatureClick={onFeatureClick} />
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={message.id} message={message} index={index} />
            ))}

            {isLoading && <LoadingIndicator />}

            <div ref={node => node?.scrollIntoView({ behavior: 'smooth' })} />
          </>
        )}
      </div>
    </div>
  )
}
