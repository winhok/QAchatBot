'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { ChatHeader } from './components/ChatHeader'
import { ChatInput } from './components/ChatInput'
import { FloatingChatBubble } from './components/FloatingChatBubble'
import SessionSidebar from './components/SessionSidebar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useChatMessages } from './stores/useChatMessages'
import { useSendMessage } from './stores/useSendMessage'
import { useSession } from './stores/useSession'
import type { SessionType } from './types/stores'

export default function HomePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const sessionType = useSession(s => s.sessionType)
  const setSessionType = useSession(s => s.setSessionType)
  const createNewSession = useSession(s => s.createNewSession)
  const updateSessionName = useSession(s => s.updateSessionName)

  const isLoading = useChatMessages(s => s.isLoading)
  const setIsLoading = useChatMessages(s => s.setIsLoading)
  const addUserMessage = useChatMessages(s => s.addUserMessage)
  const addAssistantMessage = useChatMessages(s => s.addAssistantMessage)
  const updateMessageContent = useChatMessages(s => s.updateMessageContent)
  const finishStreaming = useChatMessages(s => s.finishStreaming)
  const addErrorMessage = useChatMessages(s => s.addErrorMessage)
  const resetMessages = useChatMessages(s => s.resetMessages)
  const addToolCall = useChatMessages(s => s.addToolCall)
  const updateToolCallStatus = useChatMessages(s => s.updateToolCallStatus)

  const sendMessageFn = useSendMessage(s => s.sendMessage)

  const refreshSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }, [queryClient])

  const handleSend = (input: string) => {
    const newSessionId = crypto.randomUUID()
    createNewSession(newSessionId, sessionType)
    resetMessages()

    router.push(`/${newSessionId}`)

    setTimeout(() => {
      sendMessageFn(input, {
        sessionId: newSessionId,
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
    }, 100)
  }

  const handleQuickAction = useCallback(
    (type: SessionType) => {
      setSessionType(type)
      const newSessionId = crypto.randomUUID()
      createNewSession(newSessionId, type)
      resetMessages()
      router.push(`/${newSessionId}`)
    },
    [setSessionType, createNewSession, resetMessages, router]
  )

  const handleFeatureClick = useCallback(
    (_feature: string, type?: SessionType) => {
      if (type) {
        handleQuickAction(type)
      }
    },
    [handleQuickAction]
  )

  const handleFloatingBubbleAction = useCallback(
    (_action: string, type?: SessionType) => {
      if (type) {
        handleQuickAction(type)
      }
    },
    [handleQuickAction]
  )

  return (
    <div className='flex h-screen bg-background'>
      <SessionSidebar />

      <div className='flex flex-1 flex-col'>
        <ChatHeader />

        <div className='flex-1 flex flex-col min-h-0'>
          <WelcomeScreen onFeatureClick={handleFeatureClick} />
          <div className='px-4 pb-4'>
            <div className='max-w-3xl mx-auto'>
              <ChatInput onSend={handleSend} disabled={isLoading} sessionType={sessionType} />
            </div>
          </div>
        </div>
      </div>

      <FloatingChatBubble onQuickAction={handleFloatingBubbleAction} />
    </div>
  )
}
