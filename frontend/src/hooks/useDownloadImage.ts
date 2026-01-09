import { useCallback, useState } from 'react'

export interface UseDownloadImageReturn {
  /**
   * 下载图片
   * @param url - 图片 URL
   * @param filename - 文件名（可选，默认从 URL 提取）
   */
  downloadImage: (url: string, filename?: string) => Promise<void>
  /**
   * 是否正在下载
   */
  isDownloading: boolean
}

/**
 * 图片下载 Hook
 *
 * 支持下载任意图片 URL 到本地，
 * 处理跨域和 Blob URL 等不同情况。
 *
 * @example
 * ```tsx
 * const { downloadImage, isDownloading } = useDownloadImage()
 *
 * // 下载图片
 * await downloadImage('https://example.com/image.png', 'my-image.png')
 * ```
 */
export function useDownloadImage(): UseDownloadImageReturn {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadImage = useCallback(async (url: string, filename?: string) => {
    setIsDownloading(true)

    try {
      // 确定文件名
      const finalFilename = filename ?? extractFilename(url)

      // 如果是 Blob URL 或 Data URL，直接下载
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        triggerDownload(url, finalFilename)
        return
      }

      // 对于远程 URL，fetch 后转为 Blob
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      triggerDownload(blobUrl, finalFilename)
      URL.revokeObjectURL(blobUrl)
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    downloadImage,
    isDownloading,
  }
}

/**
 * 从 URL 提取文件名
 */
function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop()

    if (filename && /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename)) {
      return filename
    }
  } catch {
    // 无效 URL，使用默认名
  }

  return `image-${Date.now()}.png`
}

/**
 * 触发下载
 */
function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
