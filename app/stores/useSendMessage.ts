import { create } from 'zustand'
import type { ChatStore, SendMessageParams } from '../types/stores'

export const useChatStore = create<ChatStore>()(() => ({
  sendMessage: async (input: string, params: SendMessageParams) => {
    const { sessionId, addUserMessage, addAssistantMessage, updateMessageContent, finishStreaming, addErrorMessage, setIsLoading, updateSessionName } = params

    addUserMessage(input)
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
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
