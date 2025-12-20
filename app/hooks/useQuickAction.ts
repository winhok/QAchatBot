'use client'

import { useChatMessages } from '@/app/stores/useChatMessages'
import { useSession } from '@/app/stores/useSession'
import type { SessionType } from '@/app/types/stores'
import { useRouter } from 'next/navigation'

/**
 * 快速创建新会话并跳转的 hook
 * 封装了 session 创建、消息重置、路由跳转的逻辑
 */
export function useQuickAction() {
  const router = useRouter()
  const setSessionType = useSession(s => s.setSessionType)
  const setSessionId = useSession(s => s.setSessionId)
  const refreshWelcome = useSession(s => s.refreshWelcome)
  const resetMessages = useChatMessages(s => s.resetMessages)

  const startNewSession = (type: SessionType = 'normal') => {
    // 如果已经在首页（sessionId 为空），则手动触发欢迎词刷新
    if (useSession.getState().sessionId === '') {
      refreshWelcome()
    }

    setSessionType(type)
    setSessionId('') // 清空当前 ID，表示进入待创建状态
    resetMessages()

    // 只有当不在首页时才进行路由跳转，避免在首页重复请求 GET /
    if (window.location.pathname !== '/') {
      router.push('/')
    }
    return ''
  }

  return { startNewSession }
}
