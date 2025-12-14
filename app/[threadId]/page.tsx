'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { ChatHeader } from '../components/ChatHeader'
import { ChatInput } from '../components/ChatInput'
import { FloatingChatBubble } from '../components/FloatingChatBubble'
import { MessageList } from '../components/MessageList'
import SessionSidebar from '../components/SessionSidebar'
import { useChatMessages } from '../stores/useChatMessages'
import { useSendMessage } from '../stores/useSendMessage'
import { useSession } from '../stores/useSession'
import type { Message } from '../types/messages'
import type { SessionType } from '../types/stores'

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

export default function ThreadPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const threadId = params.threadId as string

  const sessionId = useSession(s => s.sessionId)
  const sessionType = useSession(s => s.sessionType)
  const setSessionId = useSession(s => s.setSessionId)
  const setSessionType = useSession(s => s.setSessionType)
  const updateSessionName = useSession(s => s.updateSessionName)
  const resetHasUserMessage = useSession(s => s.resetHasUserMessage)
  const createNewSession = useSession(s => s.createNewSession)

  const isLoading = useChatMessages(s => s.isLoading)
  const setIsLoading = useChatMessages(s => s.setIsLoading)
  const addUserMessage = useChatMessages(s => s.addUserMessage)
  const addAssistantMessage = useChatMessages(s => s.addAssistantMessage)
  const updateMessageContent = useChatMessages(s => s.updateMessageContent)
  const finishStreaming = useChatMessages(s => s.finishStreaming)
  const addErrorMessage = useChatMessages(s => s.addErrorMessage)
  const loadMessages = useChatMessages(s => s.loadMessages)
  const resetMessages = useChatMessages(s => s.resetMessages)
  const addToolCall = useChatMessages(s => s.addToolCall)
  const updateToolCallStatus = useChatMessages(s => s.updateToolCallStatus)

  const sendMessageFn = useSendMessage(s => s.sendMessage)

  useEffect(() => {
    if (threadId && threadId !== sessionId) {
      setSessionId(threadId)
      resetMessages()
    }
  }, [threadId, sessionId, setSessionId, resetMessages])

  const { data: historyData } = useQuery({
    queryKey: ['chatHistory', threadId, sessionType],
    queryFn: () => fetchHistory(threadId, sessionType),
    enabled: !!threadId && !isLoading,
    staleTime: Infinity,
    gcTime: 0,
  })

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (historyData && !hasLoadedRef.current && !isLoading) {
      loadMessages(historyData)
      resetHasUserMessage()
      hasLoadedRef.current = true
    }
  }, [historyData, isLoading, loadMessages, resetHasUserMessage])

  useEffect(() => {
    hasLoadedRef.current = false
  }, [threadId])

  const refreshSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }, [queryClient])

  const handleSend = (input: string) => {
    sendMessageFn(input, {
      sessionId: threadId,
      sessionType,
      addUserMessage,
      addAssistantMessage,
      updateMessageContent,
      finishStreaming,
      addErrorMessage,
      setIsLoading,
      updateSessionName,
      addToolCall,
      updateToolCallStatus,
      onSessionCreated: refreshSessions,
    })
  }

  const handleQuickAction = (type: SessionType) => {
    setSessionType(type)
    const newSessionId = crypto.randomUUID()
    createNewSession(newSessionId, type)
    resetMessages()
    router.push(`/${newSessionId}`)
  }

  const handleFloatingBubbleAction = (_action: string, type?: SessionType) => {
    if (type) {
      handleQuickAction(type)
    }
  }

  return (
    <div className='flex h-screen bg-background'>
      <SessionSidebar />

      <div className='flex flex-1 flex-col'>
        <ChatHeader />

        <div className='flex-1 max-w-4xl mx-auto w-full flex flex-col p-4 min-h-0'>
          <MessageList />
          <ChatInput onSend={handleSend} disabled={isLoading} sessionType={sessionType} />
        </div>
      </div>

      <FloatingChatBubble onQuickAction={handleFloatingBubbleAction} />
    </div>
  )
}
