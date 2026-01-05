import { useTheme } from '@/stores/useTheme'

/**
 * 检查当前主题是否为暗色的 Hook。
 *
 * 与 useTheme store 集成，返回解析后的主题状态。
 *
 * @returns 当前主题是否为暗色模式
 *
 * @example
 * ```tsx
 * const isDark = useIsDark()
 * const bgColor = isDark ? '#1a1a1a' : '#ffffff'
 * ```
 */
export const useIsDark = (): boolean => {
  const resolvedTheme = useTheme((s) => s.resolvedTheme)
  return resolvedTheme === 'dark'
}
