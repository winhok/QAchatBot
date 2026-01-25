import { isCuid } from '@paralleldrive/cuid2'
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { MessageList } from '@/components/chat/MessageList'
import { useChatHistory, useRegisterChatHotkeys } from '@/hooks'
import { useInvalidateSessions } from '@/hooks/useSessions'
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

  const setSessionId = useSession((s) => s.setSessionId)

  const isLoading = useChatStore((s) => s.isLoading)

  const { sendMessage } = useSendMessage()

  useEffect(() => {
    if (threadId) {
      setSessionId(threadId)
    }
  }, [threadId, setSessionId])

  useChatHistory({ threadId, enabled: !isLoading })

  // 注册聊天热键（如 Escape 停止生成）
  useRegisterChatHotkeys()

  const handleSend = (
    input: string,
    options?: { tools?: Array<string>; files?: Array<File>; deepResearch?: boolean },
  ) => {
    sendMessage(input, options?.tools, options?.files, {
      sessionId: threadId,
      onSessionCreated: invalidateSessions,
      deepResearch: options?.deepResearch,
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader sessionId={threadId} />

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0">
        <MessageList />

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}
