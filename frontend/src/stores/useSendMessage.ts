import { useUpdateSessionName } from '@/hooks/useSessions'
import type { ChatMessageContent, ToolCallData } from '@/schemas'
import type { SendMessageOptions } from '@/types/stores'
import { CanvasArtifactParser, type CanvasArtifactMetadata } from '@/utils/CanvasArtifactParser'
import { extractTextContent } from '@/utils/message'
import { getChatStoreState, useChatStore } from './chat'
import { useCanvasArtifacts } from './useCanvasArtifacts'
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
  const updateSessionNameMutation = useUpdateSessionName()
  const abortController = useChatStore((state) => state.abortController)

  const abortCurrent = () => {
    getChatStoreState().abortStreaming()
  }

  const sendMessage = async (
    input: string,
    tools?: string[],
    files?: File[],
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
      setAbortController,
      addToolCall,
      updateToolCallStatus,
    } = getChatStoreState()

    const isNewSession = !options?.sessionId && !storeSessionId
    const sessionId = options?.sessionId ?? storeSessionId

    // Abort any existing stream
    abortCurrent()

    // Create new AbortController and store it
    const controller = new AbortController()
    setAbortController(controller)

    // Construct message content with images if present
    let messageContent: ChatMessageContent = input
    if (files && files.length > 0) {
      const imageBlocks = await Promise.all(
        files.map(async (file) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          return {
            type: 'image_url' as const,
            image_url: {
              url: base64,
            },
          }
        }),
      )
      messageContent = [{ type: 'text', text: input }, ...imageBlocks]
    }

    addUserMessage(messageContent)
    setIsLoading(true)

    const textContent = extractTextContent(input)
    let assistantMessageId = ''

    try {
      // 创建 Canvas 解析器
      const canvasStore = useCanvasArtifacts.getState()
      const canvasParser = new CanvasArtifactParser({
        onArtifactStart: (metadata: CanvasArtifactMetadata) => {
          canvasStore.createArtifact(metadata.messageId, {
            id: metadata.id,
            type: metadata.type as 'react' | 'component',
            title: metadata.title,
            sessionId: sessionId || '',
          })
          canvasStore.setActiveArtifactId(metadata.id)
          canvasStore.setIsCanvasVisible(true, 'preview')
        },
        onCodeStart: (messageId: string, artifactId: string, language: string) => {
          canvasStore.startCode(messageId, artifactId, language as 'jsx')
        },
        onCodeChunk: (messageId: string, artifactId: string, chunk: string) => {
          canvasStore.appendCodeChunk(messageId, artifactId, chunk)
        },
        onCodeEnd: (messageId: string, artifactId: string, fullContent: string) => {
          canvasStore.endCode(messageId, artifactId, fullContent)
        },
        onArtifactEnd: (messageId: string, artifactId: string) => {
          canvasStore.updateArtifact(messageId, artifactId, {
            status: 'ready',
            isStreaming: false,
          })
        },
      })

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          session_id: sessionId || undefined,
          model_id: modelId,
          session_type: sessionType,
          tools,
        }),
        signal: controller.signal,
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
                    // Canvas 解析
                    canvasParser.parse(assistantMessage.id, data.content)
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
      setAbortController(null)
      setIsLoading(false)
    }
  }

  return {
    sendMessage,
    abortCurrent,
    isAborting: abortController !== null,
  }
}
