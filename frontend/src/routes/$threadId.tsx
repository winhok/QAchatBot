import { isCuid } from '@paralleldrive/cuid2'
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ChatHeader } from '@/components/ChatHeader'
import { ChatInput } from '@/components/ChatInput'
import { FloatingChatBubble } from '@/components/FloatingChatBubble'
import { MessageList } from '@/components/MessageList'
import { useChatHistory, useRegisterChatHotkeys } from '@/hooks'
import { useInvalidateSessions, useSessions } from '@/hooks/useSessions'
import { useChatStore } from '@/stores/chat'
import { useSendMessage } from '@/stores/useSendMessage'
import { useSession } from '@/stores/useSession'

export const Route = createFileRoute('/$threadId')({
  component: ThreadPage,
  beforeLoad: ({ params }) => {
    if (params.threadId && !isCuid(params.threadId)) {
      throw notFound()
    }
  },
})

function ThreadPage() {
  const { threadId } = useParams({ from: '/$threadId' })
  const invalidateSessions = useInvalidateSessions()

  const sessionType = useSession((s) => s.sessionType)
  const setSessionId = useSession((s) => s.setSessionId)
  const setSessionType = useSession((s) => s.setSessionType)

  const isLoading = useChatStore((s) => s.isLoading)

  const { sendMessage } = useSendMessage()

  const { data: sessions = [] } = useSessions()

  useEffect(() => {
    const session = sessions.find((s) => s.id === threadId)
    if (session?.type && session.type !== sessionType) {
      setSessionType(session.type)
    }
  }, [sessions, threadId, sessionType, setSessionType])

  useEffect(() => {
    if (threadId) {
      setSessionId(threadId)
    }
  }, [threadId, setSessionId])

  useChatHistory({ threadId, enabled: !isLoading })

  // 注册聊天热键（如 Escape 停止生成）
  useRegisterChatHotkeys()

  const handleSend = (input: string, tools?: Array<string>, files?: Array<File>) => {
    sendMessage(input, tools, files, {
      sessionId: threadId,
      onSessionCreated: invalidateSessions,
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader />

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0">
        <MessageList />

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>

      <FloatingChatBubble />
    </div>
  )
}
