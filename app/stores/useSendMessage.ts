import { create } from 'zustand'
import type { ToolCallData, ChatMessageContent } from '@/app/schemas'
import type { SendMessageOptions, SendMessageState } from '@/app/types/stores'
import { useChatMessages } from './useChatMessages'
import { useSession } from './useSession'
import { extractTextContent } from '@/app/utils/message'

// 统一使用 /api/chat 端点
const API_ENDPOINT = '/api/chat'

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

export const useSendMessage = create<SendMessageState>()((set, get) => ({
  currentAbortController: null,

  abortCurrent: () => {
    get().currentAbortController?.abort()
    set({ currentAbortController: null })
  },

  sendMessage: async (input: ChatMessageContent, options?: SendMessageOptions) => {
    // 内部直接获取其他 store 的状态和方法
    const { sessionId: storeSessionId, sessionType, modelId, updateSessionName, setSessionId } = useSession.getState()
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

    // 如果没有 sessionId，说明是新会话的第一条消息
    const isNewSession = !options?.sessionId && !storeSessionId
    const sessionId = options?.sessionId ?? storeSessionId

    // 中断之前的请求
    get().abortCurrent()
    const abortController = new AbortController()
    set({ currentAbortController: abortController })

    addUserMessage(input)
    setIsLoading(true)

    // 提取文本内容用于会话命名
    const textContent = extractTextContent(input)

    let assistantMessageId = ''

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          thread_id: sessionId || undefined, // 如果是新会话，传 undefined 让后端生成
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

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let finalThreadId = sessionId

      while (true) {
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
                  updateToolCallStatus(assistantMessage.id, data.tool_call_id, 'success', { result: data.output }, data.duration)
                  break
                case 'tool_error':
                  updateToolCallStatus(assistantMessage.id, data.tool_call_id, 'error', { error: data.error }, data.duration)
                  break
                case 'end':
                  finalThreadId = data.thread_id
                  // 如果是新会话，同步 ID 并跳转
                  if (isNewSession && finalThreadId) {
                    setSessionId(finalThreadId)
                    // 在客户端环境进行跳转
                    window.history.pushState({}, '', `/${finalThreadId}`)
                    // 只有在 ID 确定后才更新名称（触发后端持久化）
                    updateSessionName(textContent)
                    options?.onSessionCreated?.()
                  } else if (finalThreadId) {
                    // 非新会话也可能需要更新名称（如果是第一条消息）
                    updateSessionName(textContent)
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
      // 如果是用户主动中断，不显示错误消息
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted by user')
        if (assistantMessageId) {
          finishStreaming(assistantMessageId)
        }
      } else {
        console.error('Send message error:', error)
        addErrorMessage()
      }
    } finally {
      if (get().currentAbortController === abortController) {
        set({ currentAbortController: null })
      }
      setIsLoading(false)
    }
  },
}))
