'use client'

import { useParams, notFound } from 'next/navigation'
import { useEffect } from 'react'
import { ChatHeader } from '@/app/components/ChatHeader'
import { ChatInput } from '@/app/components/ChatInput'
import { FloatingChatBubble } from '@/app/components/FloatingChatBubble'
import { MessageList } from '@/app/components/MessageList'
import SessionSidebar from '@/app/components/SessionSidebar'
import { useChatHistory } from '@/app/hooks/useChatHistory'
import { useInvalidateSessions, useSessions } from '@/app/hooks/useSessions'
import { useChatMessages } from '@/app/stores/useChatMessages'
import { useSendMessage } from '@/app/stores/useSendMessage'
import { useSession } from '@/app/stores/useSession'
import { validate as isUuid } from 'uuid'

export default function ThreadPage() {
  const params = useParams()
  const threadId = params.threadId as string
  const invalidateSessions = useInvalidateSessions()

  // 如果 threadId 不是 UUID，则认为是不存在的路由，渲染 404 页面
  if (threadId && !isUuid(threadId)) {
    notFound()
  }

  const sessionId = useSession(s => s.sessionId)
  const sessionType = useSession(s => s.sessionType)
  const setSessionId = useSession(s => s.setSessionId)
  const setSessionType = useSession(s => s.setSessionType)

  const isLoading = useChatMessages(s => s.isLoading)
  const clearMessages = useChatMessages(s => s.clearMessages)

  const sendMessage = useSendMessage(s => s.sendMessage)

  const { data: sessions = [] } = useSessions()

  useEffect(() => {
    const session = sessions.find(s => s.id === threadId)
    if (session?.type && session.type !== sessionType) {
      setSessionType(session.type)
    }
  }, [sessions, threadId, sessionType, setSessionType])

  useEffect(() => {
    if (threadId && threadId !== sessionId) {
      setSessionId(threadId)
      clearMessages()
    }
  }, [threadId, sessionId, setSessionId, clearMessages])

  useChatHistory({ threadId, enabled: !isLoading })

  const handleSend = (input: string) => {
    sendMessage(input, {
      sessionId: threadId,
      onSessionCreated: invalidateSessions,
    })
  }

  return (
    <div className='flex h-screen bg-background'>
      <SessionSidebar />

      <div className='flex flex-1 flex-col'>
        <ChatHeader />

        <div className='flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0'>
          <MessageList />

          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>

      <FloatingChatBubble />
    </div>
  )
}
