import { useChatStore } from '@/stores/chat'
import { useSession } from '@/stores/useSession'
import type { SessionType } from '@/types/stores'
import { useNavigate } from '@tanstack/react-router'

/**
 * 快速创建新会话并跳转的 hook
 * 封装了 session 创建、消息重置、路由跳转的逻辑
 */
export function useQuickAction() {
  const navigate = useNavigate()

  const setSessionType = useSession((s) => s.setSessionType)
  const setSessionId = useSession((s) => s.setSessionId)
  const setHasModeSelected = useSession((s) => s.setHasModeSelected)
  const refreshWelcome = useSession((s) => s.refreshWelcome)
  const clearMessages = useChatStore((s) => s.clearMessages)

  const startNewSession = (type: SessionType = 'normal') => {
    const { sessionId } = useSession.getState()

    // 如果已经在首页（sessionId 为空），则手动触发欢迎词刷新
    if (sessionId === '') {
      refreshWelcome()
    }

    setSessionId('')
    setSessionType(type)
    setHasModeSelected(true)
    clearMessages()

    if (window.location.pathname !== '/') {
      navigate({ to: '/' })
    }
    return ''
  }

  const resetToLobby = () => {
    setSessionId('')
    setHasModeSelected(false)
    setSessionType('normal')
    clearMessages()
    refreshWelcome()

    if (window.location.pathname !== '/') {
      navigate({ to: '/' })
    }
  }

  return { startNewSession, resetToLobby }
}
