import { create } from 'zustand'
import type { SendMessageParams, SendMessageState, SessionType } from '../types/stores'

const API_ENDPOINTS: Record<SessionType, string> = {
  normal: '/api/chat',
  testcase: '/api/qa-workflow',
}

export const useSendMessage = create<SendMessageState>()(() => ({
  sendMessage: async (input: string, params: SendMessageParams) => {
    const { sessionId, sessionType, addUserMessage, addAssistantMessage, updateMessageContent, finishStreaming, addErrorMessage, setIsLoading, updateSessionName } = params

    const apiEndpoint = API_ENDPOINTS[sessionType] || '/api/chat'

    addUserMessage(input)
    setIsLoading(true)
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, thread_id: sessionId }),
      })
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      updateSessionName(input)
      const assistantMessage = addAssistantMessage()
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get reader')
      }
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.type === 'chunk' && data.content) {
                updateMessageContent(assistantMessage.id, data.content)
              } else if (data.type === 'end') {
                finishStreaming(assistantMessage.id)
                break
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Server error')
              }
            } catch (parseError) {
              console.error('Parse error:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      addErrorMessage()
    } finally {
      setIsLoading(false)
    }
  },
}))
