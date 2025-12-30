import type { Message } from '@/schemas'
import { useChatMessages } from '@/stores/useChatMessages'
import { useSession } from '@/stores/useSession'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

/**
 * LangGraph 消息格式
 *
 * LangGraph 返回的消息结构，包含：
 * - id: 消息类型标识数组，如 ['HumanMessage'] 或 ['AIMessage']
 * - kwargs: 消息内容，包含 content 字段
 */
interface LangGraphMessage {
  id: Array<string> | unknown
  kwargs?: { content?: string }
}

/**
 * 解析 LangGraph 消息角色
 *
 * 根据 id 数组判断消息来源：
 * - 包含 'HumanMessage' → 用户消息
 * - 其他 → AI 助手消息
 */
function parseRole(msgId: unknown): 'user' | 'assistant' {
  if (!Array.isArray(msgId)) return 'assistant'
  if (msgId.includes('HumanMessage')) return 'user'
  return 'assistant'
}

/**
 * 转换 LangGraph 消息为前端 Message 格式
 */
function transformMessages(history: Array<LangGraphMessage>): Array<Message> {
  return history.map((msg, idx) => ({
    id: String(idx + 1),
    content: msg.kwargs?.content || '',
    role: parseRole(msg.id),
    timestamp: new Date(),
  }))
}

/**
 * 从服务器获取聊天历史
 *
 * 调用 GET /api/chat?session_id=xxx 获取 LangGraph 格式的历史消息，
 * 然后转换为前端 Message 格式
 */
async function fetchHistory(sessionId: string): Promise<Array<Message>> {
  const res = await fetch(`/api/chat?session_id=${sessionId}`)
  const data = (await res.json()) as { history?: Array<LangGraphMessage> }
  if (Array.isArray(data.history) && data.history.length > 0) {
    return transformMessages(data.history)
  }
  return []
}

/**
 * 聊天历史记录 Hook
 *
 * 负责加载和管理会话的聊天历史：
 * 1. 根据 threadId 从服务器获取历史消息
 * 2. 转换 LangGraph 消息格式为前端 Message 格式
 * 3. 加载到 useChatMessages store 中
 * 4. 切换会话时自动重置加载状态
 *
 * 使用 TanStack Query 进行数据获取和缓存管理
 *
 * @param threadId - 会话线程 ID
 * @param enabled - 是否启用历史加载（切换会话时控制）
 * @returns TanStack Query result，包含 data、isLoading、error 等
 *
 * @example
 * ```tsx
 * const { isLoading, error } = useChatHistory({
 *   threadId: currentSessionId,
 *   enabled: !!currentSessionId,
 * })
 * ```
 */
export function useChatHistory({
  threadId,
  enabled,
}: {
  threadId: string
  enabled: boolean
}) {
  const loadMessages = useChatMessages((s) => s.loadMessages)
  const resetHasUserMessage = useSession((s) => s.resetHasUserMessage)
  const hasLoadedRef = useRef(false)

  const query = useQuery({
    queryKey: ['chatHistory', threadId],
    queryFn: () => fetchHistory(threadId),
    enabled: !!threadId && enabled,
    staleTime: Infinity,
    gcTime: 0,
  })

  const prevThreadIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (threadId !== prevThreadIdRef.current) {
      hasLoadedRef.current = false
      prevThreadIdRef.current = threadId
    }
  }, [threadId])

  useEffect(() => {
    if (query.data !== undefined && !hasLoadedRef.current && enabled) {
      loadMessages(query.data)
      resetHasUserMessage()
      hasLoadedRef.current = true
    }
  }, [enabled, loadMessages, query.data, resetHasUserMessage])

  return query
}
