import { useCallback, useRef, useState } from 'react'

export interface UseScreenshotReturn {
  /**
   * 截取指定元素为 Blob
   * @param selector - CSS 选择器
   * @returns 截图 Blob
   */
  captureElement: (selector: string) => Promise<Blob>
  /**
   * 截取指定元素并触发下载
   * @param selector - CSS 选择器
   * @param filename - 文件名（默认：screenshot.png）
   */
  downloadScreenshot: (selector: string, filename?: string) => Promise<void>
  /**
   * 是否正在截图
   */
  isCapturing: boolean
}

/**
 * 截图 Hook
 *
 * 使用 Canvas API 截取页面元素
 *
 * @example
 * ```tsx
 * const { captureElement, downloadScreenshot, isCapturing } = useScreenshot()
 *
 * // 截取整个对话区域
 * await downloadScreenshot('.chat-container', 'my-conversation.png')
 * ```
 */
export function useScreenshot(): UseScreenshotReturn {
  const [isCapturing, setIsCapturing] = useState(false)
  const capturingRef = useRef(false)

  const captureElement = useCallback(async (selector: string): Promise<Blob> => {
    if (capturingRef.current) {
      throw new Error('Capture already in progress')
    }

    capturingRef.current = true
    setIsCapturing(true)

    try {
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`Element not found: ${selector}`)
      }

      // 使用 Canvas API 进行简单截图
      const rect = element.getBoundingClientRect()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to create canvas context')
      }

      // 设置画布尺寸
      const scale = window.devicePixelRatio || 1
      canvas.width = rect.width * scale
      canvas.height = rect.height * scale
      ctx.scale(scale, scale)

      // 使用 SVG foreignObject 技术渲染 HTML
      const htmlContent = element.outerHTML
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `

      const img = new Image()
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      return new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob from canvas'))
            }
          }, 'image/png')
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load SVG image'))
        }
        img.src = url
      })
    } finally {
      capturingRef.current = false
      setIsCapturing(false)
    }
  }, [])

  const downloadScreenshot = useCallback(
    async (selector: string, filename = 'screenshot.png') => {
      const blob = await captureElement(selector)
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    },
    [captureElement],
  )

  return {
    captureElement,
    downloadScreenshot,
    isCapturing,
  }
}
