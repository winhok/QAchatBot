'use client'

// TODO: 自动滚动 Hook
// 功能需求：
// 1. 新消息时自动滚动到底部
// 2. 用户向上滚动时暂停自动滚动
// 3. 用户滚动到底部时恢复自动滚动
// 4. 提供 scrollToBottom 方法
// 5. 返回 isAtBottom 状态用于显示/隐藏滚动按钮
// 6. 平滑滚动动画

import { useRef, useState, useCallback, useEffect } from 'react'

interface UseAutoScrollOptions {
  threshold?: number  // 距离底部多少像素内算作"在底部"
  smooth?: boolean    // 是否平滑滚动
}

interface UseAutoScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  isAtBottom: boolean
  scrollToBottom: () => void
  shouldAutoScroll: boolean
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const { threshold = 100, smooth = true } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // TODO: 实现滚动检测逻辑
  // - 监听 scroll 事件
  // - 计算是否在底部
  // - 更新状态

  const scrollToBottom = useCallback(() => {
    // TODO: 实现滚动到底部
    // - 使用 scrollTo 或 scrollIntoView
    // - 根据 smooth 参数决定动画
  }, [smooth])

  // TODO: 监听容器滚动事件

  // TODO: 监听内容变化（MutationObserver 或依赖变化）

  return {
    containerRef,
    isAtBottom,
    scrollToBottom,
    shouldAutoScroll,
  }
}
