import { useState } from 'react'
import type { DocumentContentBlock, ImageContentBlock } from '@/schemas'
import {
  formatFileSize,
  isAudioFile,
  isImageFile,
  isPDFFile,
  isVideoFile,
  readFileAsBase64,
} from '@/utils/file'
import { compressImage, shouldCompressImage } from '@/utils/image'

// 文件上传结果类型
export type UploadResult =
  | { success: true; block: ImageContentBlock | DocumentContentBlock }
  | { success: false; error: string }

interface UseFileUploadOptions {
  /** 小文件阈值，低于此大小使用 Base64，默认 5MB */
  base64Threshold?: number
  /** 图片压缩质量，默认 0.8 */
  imageQuality?: number
  /** 图片最大宽度，默认 1920 */
  imageMaxWidth?: number
}

interface UseFileUploadReturn {
  /** 上传单个文件 */
  uploadFile: (file: File) => Promise<UploadResult>
  /** 上传多个文件 */
  uploadFiles: (files: Array<File>) => Promise<Array<UploadResult>>
  /** 是否正在上传 */
  uploading: boolean
  /** 上传进度 0-100 */
  progress: number
  /** 错误信息 */
  error: string | null
  /** 清除错误 */
  clearError: () => void
}

/**
 * 文件上传 Hook
 *
 * 支持的文件类型：
 * - 图片 (< 5MB): Base64 编码
 * - 图片 (>= 5MB): 压缩后 Base64
 * - 视频/音频/PDF: 暂不支持（提示用户）
 */
export function useFileUpload(
  options: UseFileUploadOptions = {},
): UseFileUploadReturn {
  const {
    base64Threshold = 5 * 1024 * 1024, // 5MB
    imageQuality = 0.8,
    imageMaxWidth = 1920,
  } = options

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => {
    setError(null)
  }

  const uploadFile = async (file: File): Promise<UploadResult> => {
    setError(null)

    try {
      // 处理图片文件
      if (isImageFile(file)) {
        let dataUrl: string

        // 检查是否需要压缩
        const needsCompression = await shouldCompressImage(
          file,
          base64Threshold,
        )

        if (needsCompression) {
          // 压缩图片
          const compressedBlob = await compressImage(file, {
            quality: imageQuality,
            maxWidth: imageMaxWidth,
          })

          // 将 Blob 转换为 Base64
          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
          })
          dataUrl = await readFileAsBase64(compressedFile)
        } else {
          // 直接使用 Base64
          dataUrl = await readFileAsBase64(file)
        }

        const block: ImageContentBlock = {
          type: 'image_url',
          image_url: {
            url: dataUrl,
            detail: 'auto',
          },
        }

        return { success: true, block }
      }

      // 处理 PDF 文件
      if (isPDFFile(file)) {
        if (file.size > base64Threshold) {
          return {
            success: false,
            error: `PDF 文件过大 (${formatFileSize(file.size)})，请上传小于 ${formatFileSize(base64Threshold)} 的文件`,
          }
        }

        const dataUrl = await readFileAsBase64(file)

        const block: DocumentContentBlock = {
          type: 'document',
          document: {
            mimeType: file.type,
            url: dataUrl,
          },
        }

        return { success: true, block }
      }

      // 视频和音频暂不支持
      if (isVideoFile(file)) {
        return {
          success: false,
          error: '暂不支持视频文件上传，此功能即将推出',
        }
      }

      if (isAudioFile(file)) {
        return {
          success: false,
          error: '暂不支持音频文件上传，此功能即将推出',
        }
      }

      // 不支持的文件类型
      return {
        success: false,
        error: `不支持的文件类型: ${file.type || '未知'}`,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件处理失败'
      return { success: false, error: errorMessage }
    }
  }

  const uploadFiles = async (
    files: Array<File>,
  ): Promise<Array<UploadResult>> => {
    setUploading(true)
    setProgress(0)

    const results: Array<UploadResult> = []
    const total = files.length

    for (let i = 0; i < total; i++) {
      const result = await uploadFile(files[i])
      results.push(result)
      setProgress(Math.round(((i + 1) / total) * 100))
    }

    setUploading(false)
    return results
  }

  return {
    uploadFile,
    uploadFiles,
    uploading,
    progress,
    error,
    clearError,
  }
}
