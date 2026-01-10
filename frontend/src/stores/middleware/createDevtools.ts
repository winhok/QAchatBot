import { devtools } from 'zustand/middleware'

/**
 * 可配置的 DevTools 中间件
 * 通过 URL 参数 ?debug=<name> 启用调试
 *
 * @example
 * const useStore = create(createDevtools('chat')((...a) => ({ ... })))
 * // 访问 ?debug=chat 启用 DevTools
 */
export const createDevtools = (name: string) => {
  let enabled = false

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    const debug = url.searchParams.get('debug')
    if (debug?.includes(name)) {
      enabled = true
    }
  }

  return (initializer: any) =>
    devtools(initializer, {
      name: `QABot_${name}`,
      enabled,
    })
}
