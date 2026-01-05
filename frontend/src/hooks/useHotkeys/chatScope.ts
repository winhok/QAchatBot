import { useSendMessage } from '@/stores/useSendMessage'
import { useHotkeyById } from './useHotkeyById'

/**
 * 停止生成热键 (Escape)
 */
export const useStopGenerationHotkey = () => {
  const { abortCurrent, isAborting } = useSendMessage()
  return useHotkeyById('stopGeneration', abortCurrent, {
    enabled: isAborting,
  })
}

/**
 * 注册所有聊天作用域的热键。
 *
 * 在聊天布局组件中调用此 hook 以启用聊天相关热键。
 *
 * @example
 * ```tsx
 * function ChatLayout() {
 *   useRegisterChatHotkeys()
 *   return <ChatContent />
 * }
 * ```
 */
export const useRegisterChatHotkeys = () => {
  useStopGenerationHotkey()
  // 在此添加更多聊天特定热键
}
