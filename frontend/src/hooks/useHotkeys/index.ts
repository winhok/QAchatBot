/**
 * 热键系统模块
 *
 * 提供基于 react-hotkeys-hook 的热键管理功能。
 *
 * @example
 * ```tsx
 * // 在根布局中注册全局热键
 * useRegisterGlobalHotkeys({ onSearchOpen: () => setSearchOpen(true) })
 *
 * // 在聊天页面注册聊天热键
 * useRegisterChatHotkeys()
 *
 * // 单独使用特定热键
 * useHotkeyById('newSession', () => createSession())
 * ```
 */
export { useRegisterChatHotkeys, useStopGenerationHotkey } from './chatScope'
export {
  useNewSessionHotkey,
  useRegisterGlobalHotkeys,
  useSearchHotkey,
  useToggleSidebarHotkey,
  useToggleThemeHotkey,
} from './globalScope'
export { useHotkeyById } from './useHotkeyById'
