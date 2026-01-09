import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from '@/stores/useTheme'

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: 'light' | 'dark' | 'system'
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps) {
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)

  // 初始化时设置默认主题（仅在首次加载且没有存储的主题时）
  useEffect(() => {
    // 检查 localStorage 是否有存储的主题
    const stored = localStorage.getItem('theme-storage')
    if (!stored) {
      setTheme(defaultTheme)
    } else {
      // 重新应用已存储的主题
      setTheme(theme)
    }
  }, [])

  return <>{children}</>
}
