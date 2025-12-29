import { createFileRoute } from '@tanstack/react-router'
import { ChatHeader } from '@/components/ChatHeader'
import { ChatInput } from '@/components/ChatInput'
import { FloatingChatBubble } from '@/components/FloatingChatBubble'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { useInvalidateSessions } from '@/hooks/useSessions'
import { useChatMessages } from '@/stores/useChatMessages'
import { useSendMessage } from '@/stores/useSendMessage'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const invalidateSessions = useInvalidateSessions()

  const isLoading = useChatMessages((s) => s.isLoading)
  const { sendMessage } = useSendMessage()

  const handleSend = (input: string) => {
    // 首页发送第一条消息时，逻辑统一交给 useSendMessage 处理
    // 它会识别到没有 sessionId 并进行初始化
    sendMessage(input, {
      onSessionCreated: () => {
        invalidateSessions()
      },
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader />

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0">
        <WelcomeScreen />

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>

      <FloatingChatBubble />
    </div>
  )
}
