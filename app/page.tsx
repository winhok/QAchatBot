'use client'

import { useQuery } from '@tanstack/react-query'
import { BackgroundEffects } from './components/BackgroundEffects'
import { ChatHeader } from './components/ChatHeader'
import { ChatInput } from './components/ChatInput'
import { MessageList } from './components/MessageList'
import SessionSidebar from './components/SessionSidebar'
import { useChatMessages } from './stores/useChatMessages'
import { useSendMessage } from './stores/useSendMessage'
import { useSession } from './stores/useSession'
import type { Message } from './types/messages'
import type { SessionType } from './types/stores'

interface LangGraphMessage {
  id: string[] | unknown
  kwargs?: { content?: string }
}

function parseRole(msgId: unknown): 'user' | 'assistant' {
  if (!Array.isArray(msgId)) return 'assistant'
  if (msgId.includes('HumanMessage')) return 'user'
  return 'assistant'
}

function transformMessages(history: LangGraphMessage[]): Message[] {
  return history.map((msg, idx) => ({
    id: String(idx + 1),
    content: msg.kwargs?.content || '',
    role: parseRole(msg.id),
    timestamp: new Date(),
  }))
}

const API_HISTORY_ENDPOINTS: Record<SessionType, string> = {
  normal: '/api/chat',
  testcase: '/api/qa-workflow',
}

async function fetchHistory(sessionId: string, sessionType: SessionType): Promise<Message[]> {
  const endpoint = API_HISTORY_ENDPOINTS[sessionType] || '/api/chat'
  const res = await fetch(`${endpoint}?thread_id=${sessionId}`)
  const data = await res.json()
  if (Array.isArray(data.history) && data.history.length > 0) {
    return transformMessages(data.history)
  }
  return []
}

export default function ChatPage() {
  const sessionId = useSession(s => s.sessionId)
  const sessionType = useSession(s => s.sessionType)
  const updateSessionName = useSession(s => s.updateSessionName)
  const resetHasUserMessage = useSession(s => s.resetHasUserMessage)

  const isLoading = useChatMessages(s => s.isLoading)
  const setIsLoading = useChatMessages(s => s.setIsLoading)
  const addUserMessage = useChatMessages(s => s.addUserMessage)
  const addAssistantMessage = useChatMessages(s => s.addAssistantMessage)
  const updateMessageContent = useChatMessages(s => s.updateMessageContent)
  const finishStreaming = useChatMessages(s => s.finishStreaming)
  const addErrorMessage = useChatMessages(s => s.addErrorMessage)
  const loadMessages = useChatMessages(s => s.loadMessages)

  const sendMessageFn = useSendMessage(s => s.sendMessage)

  useQuery({
    queryKey: ['chatHistory', sessionId, sessionType],
    queryFn: () => fetchHistory(sessionId, sessionType),
    select: data => {
      loadMessages(data)
      resetHasUserMessage()
      return data
    },
    staleTime: 0,
    gcTime: 0,
  })

  const handleSend = (input: string) => {
    sendMessageFn(input, {
      sessionId,
      sessionType,
      addUserMessage,
      addAssistantMessage,
      updateMessageContent,
      finishStreaming,
      addErrorMessage,
      setIsLoading,
      updateSessionName,
    })
  }

  return (
    <div className='h-screen flex flex-col bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden'>
      <BackgroundEffects />
      <ChatHeader />

      <div className='relative z-10 flex flex-1 h-0'>
        <SessionSidebar />

        <div className='flex-1 flex flex-col'>
          <div className='flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0'>
            <MessageList />
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
