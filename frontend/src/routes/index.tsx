import { createFileRoute } from '@tanstack/react-router'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { WelcomeScreen } from '@/components/chat/WelcomeScreen'
import { useInvalidateSessions, useRegisterChatHotkeys } from '@/hooks'
import type { ChatSearchParams } from '@/lib/searchParams'
import { useChatStore } from '@/stores/chat'
import { useSendMessage } from '@/stores/useSendMessage'

/**
 * Validate and parse search params for chat routes
 * Ensures type safety without runtime type assertions
 */
function validateSearch(search: Record<string, unknown>): ChatSearchParams {
  return {
    hideToolCalls: search.hideToolCalls === true || search.hideToolCalls === 'true',
  }
}

export const Route = createFileRoute('/')({
  component: HomePage,
  validateSearch,
})

function HomePage() {
  const invalidateSessions = useInvalidateSessions()

  const isLoading = useChatStore((s) => s.isLoading)
  const { sendMessage } = useSendMessage()

  // 注册聊天热键（如 Escape 停止生成）
  useRegisterChatHotkeys()

  const handleSend = (
    input: string,
    options?: { tools?: Array<string>; files?: Array<File>; deepResearch?: boolean },
  ) => {
    // 首页发送第一条消息时，逻辑统一交给 useSendMessage 处理
    // 它会识别到没有 sessionId 并进行初始化
    sendMessage(input, options?.tools, options?.files, {
      onSessionCreated: () => {
        invalidateSessions()
      },
      deepResearch: options?.deepResearch,
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader />

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center p-4 min-h-0">
        <WelcomeScreen />

        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}
