import { useQuickAction } from '@/hooks/useQuickAction'
import { useTheme } from '@/stores/useTheme'
import { useHotkeyById } from './useHotkeyById'

/**
 * 新建会话热键 (Cmd/Ctrl + N)
 */
export const useNewSessionHotkey = () => {
  const { startNewSession } = useQuickAction()
  return useHotkeyById('newSession', () => startNewSession())
}

/**
 * 打开搜索热键 (Cmd/Ctrl + K)
 */
export const useSearchHotkey = (onOpen: () => void) => {
  return useHotkeyById('search', onOpen)
}

/**
 * 切换主题热键 (Cmd/Ctrl + Shift + L)
 */
export const useToggleThemeHotkey = () => {
  const { theme, setTheme } = useTheme()
  return useHotkeyById('toggleTheme', () => {
    // system -> light -> dark -> system
    const nextTheme =
      theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(nextTheme)
  })
}

/**
 * 切换侧边栏热键 (Cmd/Ctrl + B)
 */
export const useToggleSidebarHotkey = (onToggle: () => void) => {
  return useHotkeyById('toggleSidebar', onToggle)
}

interface GlobalHotkeyProps {
  /** 打开搜索对话框的回调 */
  onSearchOpen: () => void
  /** 切换侧边栏的回调 */
  onToggleSidebar?: () => void
}

/**
 * 注册所有全局作用域的热键。
 *
 * 在根布局组件中调用此 hook 以启用全局热键。
 *
 * @param props - 热键回调配置
 *
 * @example
 * ```tsx
 * function RootLayout() {
 *   const [searchOpen, setSearchOpen] = useState(false)
 *   useRegisterGlobalHotkeys({
 *     onSearchOpen: () => setSearchOpen(true),
 *   })
 *   return <App />
 * }
 * ```
 */
export const useRegisterGlobalHotkeys = (props: GlobalHotkeyProps) => {
  useNewSessionHotkey()
  useSearchHotkey(props.onSearchOpen)
  useToggleThemeHotkey()

  if (props.onToggleSidebar) {
    useToggleSidebarHotkey(props.onToggleSidebar)
  }
}
