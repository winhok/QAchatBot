'use client'

import { useRouter } from 'next/navigation'
import { ChatHeader } from '@/app/components/ChatHeader'
import { ChatInput } from '@/app/components/ChatInput'
import { FloatingChatBubble } from '@/app/components/FloatingChatBubble'
import SessionSidebar from '@/app/components/SessionSidebar'
import { WelcomeScreen } from '@/app/components/WelcomeScreen'
import { useInvalidateSessions } from '@/app/hooks/useSessions'
import { useChatMessages } from '@/app/stores/useChatMessages'
import { useSendMessage } from '@/app/stores/useSendMessage'
import { useSession } from '@/app/stores/useSession'

export default function HomePage() {
  const router = useRouter()
  const invalidateSessions = useInvalidateSessions()

  const sessionType = useSession(s => s.sessionType)
  const createNewSession = useSession(s => s.createNewSession)

  const isLoading = useChatMessages(s => s.isLoading)
  const resetMessages = useChatMessages(s => s.resetMessages)

  const sendMessage = useSendMessage(s => s.sendMessage)

  const handleSend = (input: string) => {
    // 首页发送第一条消息时，不再在此处生成 ID 并跳转
    // 逻辑统一交给 useSendMessage 处理，它会识别到没有 sessionId 并进行初始化
    sendMessage(input, {
      onSessionCreated: () => {
        invalidateSessions()
      },
    })
  }

  return (
    <div className='flex h-screen bg-background'>
      <SessionSidebar />

      <div className='flex flex-1 flex-col'>
        <ChatHeader />

        <div className='flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0'>
          <WelcomeScreen />

          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>

      <FloatingChatBubble />
    </div>
  )
}
