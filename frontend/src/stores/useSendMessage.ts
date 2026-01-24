import { getChatStoreState, useChatStore } from './chat'
import { useBranchStore } from './useBranchStore'
import { useCanvasArtifacts } from './useCanvasArtifacts'
import { useSession } from './useSession'
import type { ChatMessageContent, ToolCallData } from '@/schemas'
import type { SendMessageOptions } from '@/types/stores'
import type { CanvasArtifactMetadata } from '@/utils/CanvasArtifactParser'
import { CanvasArtifactParser } from '@/utils/CanvasArtifactParser'
import { extractTextContent } from '@/utils/message'
import { useUpdateSessionName } from '@/hooks/useSessions'

const API_ENDPOINT = '/api/chat'

const TOOL_TYPE_PATTERNS: ReadonlyArray<{
  keywords: ReadonlyArray<string>
  type: ToolCallData['type']
}> = [
  { keywords: ['api', 'http', 'fetch', 'request'], type: 'api' },
  { keywords: ['db', 'database', 'query', 'sql'], type: 'database' },
]

function inferToolType(toolName: string): ToolCallData['type'] {
  const name = toolName.toLowerCase()
  const match = TOOL_TYPE_PATTERNS.find((pattern) =>
    pattern.keywords.some((keyword) => name.includes(keyword)),
  )
  return match?.type ?? 'script'
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

async function buildMessageContent(
  input: string,
  files?: Array<File>,
): Promise<ChatMessageContent> {
  if (!files || files.length === 0) {
    return input
  }
  const imageBlocks = await Promise.all(
    files.map(async (file) => ({
      type: 'image_url' as const,
      image_url: { url: await fileToBase64(file) },
    })),
  )
  return [{ type: 'text', text: input }, ...imageBlocks]
}

function createCanvasParserCallbacks(sessionId: string) {
  const canvasStore = useCanvasArtifacts.getState()

  return {
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
  }
}

export function useSendMessage() {
  const updateSessionNameMutation = useUpdateSessionName()
  const abortController = useChatStore((state) => state.abortController)

  const abortCurrent = () => {
    getChatStoreState().abortStreaming()
  }

  async function sendMessage(
    input: string,
    tools?: Array<string>,
    files?: Array<File>,
    options?: SendMessageOptions,
  ): Promise<void> {
    const {
      sessionId: storeSessionId,
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
    const messageContent = await buildMessageContent(input, files)

    addUserMessage(messageContent)
    setIsLoading(true)

    const textContent = extractTextContent(input)
    let assistantMessageId = ''

    try {
      const canvasParser = new CanvasArtifactParser(createCanvasParserCallbacks(sessionId))

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          session_id: sessionId || undefined,
          model_id: modelId,
          tools,
          checkpoint_id: options?.checkpointId, // LangGraph Time Travel fork
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
                  }
                  if (finalThreadId && !hasUserMessage) {
                    updateSessionNameMutation.mutate({
                      id: finalThreadId,
                      name: textContent,
                    })
                    useSession.setState({ hasUserMessage: true })
                    options?.onSessionCreated?.()
                  }
                  // 同步新的 checkpoint_id 到 branch store
                  if (data.checkpoint_id) {
                    useBranchStore.getState().setCurrentCheckpoint(data.checkpoint_id)
                  }
                  // 传递 checkpointId 到 finishStreaming，存储到消息中用于后续分叉
                  finishStreaming(assistantMessage.id, data.checkpoint_id)
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
