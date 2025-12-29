/**
 * 文件处理工具函数
 */

// 图片 MIME 类型
const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
]

// 视频 MIME 类型
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']

// 音频 MIME 类型
const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/flac',
]

// PDF MIME 类型
const PDF_TYPES = ['application/pdf']

/**
 * 将文件读取为 Base64 格式
 * @returns data:image/jpeg;base64,... 格式的字符串
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 获取文件的 MIME 类型
 */
export function getFileMimeType(file: File): string {
  return file.type || 'application/octet-stream'
}

/**
 * 检查文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/')
}

/**
 * 检查文件是否为视频
 */
export function isVideoFile(file: File): boolean {
  return VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/')
}

/**
 * 检查文件是否为音频
 */
export function isAudioFile(file: File): boolean {
  return AUDIO_TYPES.includes(file.type) || file.type.startsWith('audio/')
}

/**
 * 检查文件是否为 PDF
 */
export function isPDFFile(file: File): boolean {
  return PDF_TYPES.includes(file.type)
}

/**
 * 检查文件是否为文档类型
 */
export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/csv',
  ]
  return documentTypes.includes(file.type)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot + 1).toLowerCase()
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

/**
 * 验证文件类型
 */
export function validateFileType(
  file: File,
  acceptedTypes: Array<string>,
): boolean {
  // 支持通配符如 'image/*'
  return acceptedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -1)
      return file.type.startsWith(prefix)
    }
    return file.type === type
  })
}

/**
 * 生成唯一的文件 ID
 */
export function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
