import { useCallback } from 'react'
import { useCopyToClipboard } from './useCopyToClipboard'

export interface ShareData {
  /**
   * 分享标题
   */
  title?: string
  /**
   * 分享文本/描述
   */
  text?: string
  /**
   * 分享 URL
   */
  url?: string
}

export interface UseShareReturn {
  /**
   * 是否支持 Web Share API
   */
  canShare: boolean
  /**
   * 触发原生分享
   * @param data - 分享数据
   */
  share: (data: ShareData) => Promise<void>
  /**
   * 复制链接到剪贴板
   * @param url - 要复制的 URL
   */
  copyLink: (url: string) => Promise<boolean>
}

/**
 * 分享 Hook
 *
 * 使用 Web Share API 实现原生分享功能，
 * 在不支持的浏览器上回退到复制链接。
 *
 * @example
 * ```tsx
 * const { canShare, share, copyLink } = useShare()
 *
 * // 使用原生分享
 * if (canShare) {
 *   await share({
 *     title: 'My Conversation',
 *     text: 'Check out this chat!',
 *     url: window.location.href,
 *   })
 * } else {
 *   await copyLink(window.location.href)
 * }
 * ```
 */
export function useShare(): UseShareReturn {
  const { copy } = useCopyToClipboard()

  // 检查 Web Share API 支持
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  const share = useCallback(
    async (data: ShareData) => {
      if (!canShare) {
        // 不支持原生分享时，回退到复制 URL
        if (data.url) {
          await copy(data.url)
        }
        return
      }

      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        })
      } catch (error) {
        // 用户取消分享不算错误
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        throw error
      }
    },
    [canShare, copy],
  )

  const copyLink = useCallback(
    async (url: string) => {
      return copy(url)
    },
    [copy],
  )

  return {
    canShare,
    share,
    copyLink,
  }
}
