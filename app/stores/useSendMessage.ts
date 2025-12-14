import { create } from 'zustand'
import type { ToolCallData } from '../types/messages'
import type { SendMessageParams, SendMessageState, SessionType } from '../types/stores'

const API_ENDPOINTS: Record<SessionType, string> = {
  normal: '/api/chat',
  testcase: '/api/qa-workflow',
}

// 根据工具名推断工具类型
function inferToolType(toolName: string): ToolCallData['type'] {
  const name = toolName.toLowerCase()
  if (name.includes('api') || name.includes('http') || name.includes('fetch') || name.includes('request')) {
    return 'api'
  }
  if (name.includes('db') || name.includes('database') || name.includes('query') || name.includes('sql')) {
    return 'database'
  }
  return 'script'
}

export const useSendMessage = create<SendMessageState>()(() => ({
  sendMessage: async (input: string, params: SendMessageParams) => {
    const {
      sessionId,
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
      onSessionCreated,
    } = params

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
      onSessionCreated?.()
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
              switch (data.type) {
                case 'chunk':
                  if (data.content) {
                    updateMessageContent(assistantMessage.id, data.content)
                  }
                  break
                case 'tool_start': {
                  const toolCall: ToolCallData = {
                    id: data.tool_call_id,
                    name: data.name,
                    type: inferToolType(data.name),
                    status: 'running',
                    input: data.input,
                  }
                  addToolCall(assistantMessage.id, toolCall)
                  break
                }
                case 'tool_end':
                  updateToolCallStatus(assistantMessage.id, data.tool_call_id, 'success', { result: data.output }, data.duration)
                  break
                case 'tool_error':
                  updateToolCallStatus(assistantMessage.id, data.tool_call_id, 'error', { error: data.error }, data.duration)
                  break
                case 'end':
                  finishStreaming(assistantMessage.id)
                  break
                case 'error':
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
