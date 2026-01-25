import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoScrollOptions {
  /** 距离底部多少像素内算作"在底部"，默认 100 */
  threshold?: number
  /** 是否平滑滚动，默认 true */
  smooth?: boolean
  /** 依赖项变化时触发自动滚动检查 (use stable reference or primitive) */
  dependencyKey?: string | number
}

interface UseAutoScrollReturn {
  /** 绑定到滚动容器的 ref */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** 当前是否在底部 */
  isAtBottom: boolean
  /** 滚动到底部 */
  scrollToBottom: () => void
  /** 是否应该自动滚动（用户未手动向上滚动） */
  shouldAutoScroll: boolean
  /** 手动设置是否自动滚动 */
  setShouldAutoScroll: (value: boolean) => void
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const { threshold = 100, smooth = true, dependencyKey } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // 用于防止滚动事件和编程滚动的冲突
  const isScrollingProgrammatically = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 检查是否在底部 - memoized to prevent recreation
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom <= threshold
  }, [threshold])

  // 滚动到底部 - memoized with stable dependencies
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    isScrollingProgrammatically.current = true

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })

    // 平滑滚动需要一点时间完成
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(
      () => {
        isScrollingProgrammatically.current = false
        setIsAtBottom(true)
        setShouldAutoScroll(true)
      },
      smooth ? 300 : 50,
    )
  }, [smooth])

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // 忽略编程触发的滚动
      if (isScrollingProgrammatically.current) return

      const atBottom = checkIfAtBottom()
      setIsAtBottom(atBottom)

      // 如果用户手动滚动到底部，恢复自动滚动
      if (atBottom) {
        setShouldAutoScroll(true)
      } else {
        // 用户向上滚动，暂停自动滚动
        setShouldAutoScroll(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [checkIfAtBottom])

  // 依赖项变化时，如果应该自动滚动，则滚动到底部
  // Uses dependencyKey (primitive) instead of spreading array
  useEffect(() => {
    if (shouldAutoScroll) {
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [shouldAutoScroll, scrollToBottom, dependencyKey])

  return {
    containerRef,
    isAtBottom,
    scrollToBottom,
    shouldAutoScroll,
    setShouldAutoScroll,
  }
}
