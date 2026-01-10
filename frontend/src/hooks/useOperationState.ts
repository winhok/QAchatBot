import { useShallow } from 'zustand/react/shallow'
import { useChatStore } from '@/stores/chat'

/**
 * 消息操作状态
 */
export interface MessageOperationState {
  /** 消息是否正在流式输出 */
  isStreaming: boolean
  /** 消息是否正在加载 */
  isLoading: boolean
  /** 消息是否有错误 */
  hasError: boolean
}

/**
 * 工具调用操作状态
 */
export interface ToolOperationState {
  /** 工具是否正在运行 */
  isRunning: boolean
  /** 工具是否执行成功 */
  isSuccess: boolean
  /** 工具是否执行失败 */
  isError: boolean
}

const DEFAULT_MESSAGE_STATE: MessageOperationState = {
  isStreaming: false,
  isLoading: false,
  hasError: false,
}

const DEFAULT_TOOL_STATE: ToolOperationState = {
  isRunning: false,
  isSuccess: false,
  isError: false,
}

/**
 * 获取特定消息操作状态的 Hook。
 *
 * 提供派生状态如 isStreaming、isLoading、hasError。
 *
 * @param messageId - 消息 ID
 * @returns 消息操作状态
 *
 * @example
 * ```tsx
 * const { isStreaming, hasError } = useMessageOperationState(messageId)
 * if (isStreaming) return <LoadingSpinner />
 * ```
 */
export const useMessageOperationState = (messageId: string): MessageOperationState => {
  const { messages, isLoading } = useChatStore(
    useShallow((s) => ({
      messages: s.messages,
      isLoading: s.isLoading,
    })),
  )

  const message = messages.find((m) => m.id === messageId)
  if (!message) {
    return DEFAULT_MESSAGE_STATE
  }

  // 检查消息内容是否包含错误标记
  const hasError = typeof message.content === 'string' && message.content.includes('[错误]')

  return {
    isStreaming: message.isStreaming ?? false,
    isLoading: isLoading && message.role === 'assistant',
    hasError,
  }
}

/**
 * 获取特定工具调用操作状态的 Hook。
 *
 * @param messageId - 消息 ID
 * @param toolCallId - 工具调用 ID
 * @returns 工具调用操作状态
 *
 * @example
 * ```tsx
 * const { isRunning, isError } = useToolOperationState(messageId, toolCallId)
 * if (isRunning) return <ToolRunningIndicator />
 * ```
 */
export const useToolOperationState = (
  messageId: string,
  toolCallId: string,
): ToolOperationState => {
  const messages = useChatStore((s) => s.messages)

  const message = messages.find((m) => m.id === messageId)
  const toolCall = message?.toolCalls?.find((tc) => tc.id === toolCallId)

  if (!toolCall) {
    return DEFAULT_TOOL_STATE
  }

  return {
    isRunning: toolCall.status === 'running',
    isSuccess: toolCall.status === 'success',
    isError: toolCall.status === 'error',
  }
}
