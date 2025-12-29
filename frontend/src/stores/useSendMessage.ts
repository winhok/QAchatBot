import { useUpdateSessionName } from '@/hooks/useSessions'
import type { ChatMessageContent, ToolCallData } from '@/schemas'
import type { SendMessageOptions } from '@/types/stores'
import { extractTextContent } from '@/utils/message'
import { useState } from 'react'
import { useChatMessages } from './useChatMessages'
import { useSession } from './useSession'

// 统一使用 /api/chat 端点
const API_ENDPOINT = '/api/chat'

// 根据工具名推断工具类型
function inferToolType(toolName: string): ToolCallData['type'] {
  const name = toolName.toLowerCase()
  if (
    name.includes('api') ||
    name.includes('http') ||
    name.includes('fetch') ||
    name.includes('request')
  ) {
    return 'api'
  }
  if (
    name.includes('db') ||
    name.includes('database') ||
    name.includes('query') ||
    name.includes('sql')
  ) {
    return 'database'
  }
  return 'script'
}

export function useSendMessage() {
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null)
  const updateSessionNameMutation = useUpdateSessionName()

  const abortCurrent = () => {
    currentAbortController?.abort()
    setCurrentAbortController(null)
  }

  const sendMessage = async (
    input: ChatMessageContent,
    options?: SendMessageOptions,
  ) => {
    const {
      sessionId: storeSessionId,
      sessionType,
      modelId,
      setSessionId,
      hasUserMessage,
    } = useSession.getState()
    const {
      addUserMessage,
      addAssistantMessage,
      updateMessageContent,
      finishStreaming,
      addErrorMessage,
      setIsLoading,
      addToolCall,
      updateToolCallStatus,
    } = useChatMessages.getState()

    const isNewSession = !options?.sessionId && !storeSessionId
    const sessionId = options?.sessionId ?? storeSessionId

    abortCurrent()
    const abortController = new AbortController()
    setCurrentAbortController(abortController)

    addUserMessage(input)
    setIsLoading(true)

    const textContent = extractTextContent(input)
    let assistantMessageId = ''

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: sessionId || undefined,
          model_id: modelId,
          session_type: sessionType,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const assistantMessage = addAssistantMessage()
      assistantMessageId = assistantMessage.id

      const reader = (response.body as ReadableStream<Uint8Array>).getReader()

      const decoder = new TextDecoder()
      let buffer = ''
      let finalThreadId = sessionId

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break

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
                  updateToolCallStatus(
                    assistantMessage.id,
                    data.tool_call_id,
                    'success',
                    { result: data.output },
                    data.duration,
                  )
                  break
                case 'tool_error':
                  updateToolCallStatus(
                    assistantMessage.id,
                    data.tool_call_id,
                    'error',
                    { error: data.error },
                    data.duration,
                  )
                  break
                case 'end':
                  finalThreadId = data.session_id
                  if (isNewSession && finalThreadId) {
                    setSessionId(finalThreadId)
                    window.history.pushState({}, '', `/${finalThreadId}`)
                    if (!hasUserMessage) {
                      updateSessionNameMutation.mutate({
                        id: finalThreadId,
                        name: textContent,
                      })
                      useSession.setState({ hasUserMessage: true })
                    }
                    options?.onSessionCreated?.()
                  } else if (finalThreadId && !hasUserMessage) {
                    updateSessionNameMutation.mutate({
                      id: finalThreadId,
                      name: textContent,
                    })
                    useSession.setState({ hasUserMessage: true })
                    options?.onSessionCreated?.()
                  }
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
      if (error instanceof Error && error.name === 'AbortError') {
        if (assistantMessageId) {
          finishStreaming(assistantMessageId)
        }
      } else {
        console.error('Send message error:', error)
        addErrorMessage()
      }
    } finally {
      setCurrentAbortController(null)
      setIsLoading(false)
    }
  }

  return {
    sendMessage,
    abortCurrent,
    isAborting: currentAbortController !== null,
  }
}
