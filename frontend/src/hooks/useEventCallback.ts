import { useLayoutEffect, useRef } from 'react'

/**
 * 返回一个稳定的回调引用，始终调用最新版本的 fn。
 *
 * 当需要将回调传递给 memo 化的子组件而不引起重新渲染时非常有用。
 * 注意：React Compiler 通常会自动处理这种情况，此 hook 用于特殊场景。
 *
 * @example
 * ```tsx
 * const handleClick = useEventCallback((e: MouseEvent) => {
 *   console.log(someStateValue) // 始终获取最新值
 * })
 * ```
 */
export const useEventCallback = <T extends (...args: Array<unknown>) => unknown>(fn: T): T => {
  const ref = useRef<T>(fn)

  useLayoutEffect(() => {
    ref.current = fn
  }, [fn])

  // 返回稳定引用的包装函数
  const stableCallback = (...args: Parameters<T>) => {
    return ref.current(...args)
  }

  return stableCallback as T
}
