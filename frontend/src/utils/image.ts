/**
 * 图片处理工具函数
 */

interface CompressOptions {
  /** 最大宽度，默认 1920 */
  maxWidth?: number
  /** 压缩质量 0-1，默认 0.8 */
  quality?: number
  /** 输出格式，默认 image/jpeg */
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp'
}

interface ImageDimensions {
  width: number
  height: number
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * 计算保持宽高比的缩放尺寸
 */
export function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
): ImageDimensions {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight }
  }

  const ratio = maxWidth / originalWidth
  return {
    width: maxWidth,
    height: Math.round(originalHeight * ratio),
  }
}

/**
 * 压缩图片
 */
export function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<Blob> {
  const { maxWidth = 1920, quality = 0.8, outputType = 'image/jpeg' } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 计算缩放后的尺寸
      const { width, height } = calculateScaledDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxWidth,
      )

      // 创建 canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)

      // 导出为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        outputType,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}

/**
 * 创建图片缩略图
 */
export function createThumbnail(
  file: File,
  maxSize: number = 200,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 计算缩略图尺寸
      let width = img.naturalWidth
      let height = img.naturalHeight

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      // 创建 canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // 绘制缩略图
      ctx.drawImage(img, 0, 0, width, height)

      // 返回 data URL
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to create thumbnail'))
    }

    img.src = url
  })
}

/**
 * 检查图片是否需要压缩
 */
export async function shouldCompressImage(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024,
): Promise<boolean> {
  // 文件大小超过阈值
  if (file.size > maxSizeBytes) {
    return true
  }

  // 检查尺寸是否过大
  try {
    const { width, height } = await getImageDimensions(file)
    return width > 1920 || height > 1920
  } catch {
    return false
  }
}
