import { useEffect, useRef, useState } from 'react'
import { FileIcon, FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { UploadResult } from '@/hooks/useFileUpload'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFileUpload } from '@/hooks/useFileUpload'
import {
  formatFileSize,
  generateFileId,
  isImageFile,
  validateFileSize,
  validateFileType,
} from '@/utils/file'
import { createThumbnail } from '@/utils/image'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  thumbnailUrl?: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  result?: UploadResult
}

interface FileUploadAreaProps {
  /** 文件变化回调 */
  onFilesChange: (files: Array<UploadedFile>) => void
  /** 最大文件数量，默认 5 */
  maxFiles?: number
  /** 单文件最大大小（字节），默认 10MB */
  maxSize?: number
  /** 接受的 MIME 类型 */
  acceptedTypes?: Array<string>
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

export function FileUploadArea({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  acceptedTypes = ['image/*', 'application/pdf'],
  disabled = false,
  className,
}: FileUploadAreaProps) {
  const [files, setFiles] = useState<Array<UploadedFile>>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadFile } = useFileUpload()

  // 同步文件变化
  useEffect(() => {
    onFilesChange(files)
  }, [files, onFilesChange])

  // 处理文件上传
  const processFiles = async (fileList: FileList | Array<File>) => {
    const newFiles = Array.from(fileList)

    // 检查文件数量限制
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    for (const file of newFiles) {
      // 验证文件大小
      if (!validateFileSize(file, maxSize)) {
        toast.error(`文件 "${file.name}" 超过大小限制 (${formatFileSize(maxSize)})`)
        continue
      }

      // 验证文件类型
      if (!validateFileType(file, acceptedTypes)) {
        toast.error(`不支持的文件类型: ${file.type || '未知'}`)
        continue
      }

      const fileId = generateFileId()

      // 创建初始文件记录
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading',
      }

      // 如果是图片，创建缩略图
      if (isImageFile(file)) {
        try {
          uploadedFile.thumbnailUrl = await createThumbnail(file, 100)
        } catch {
          // 缩略图创建失败不影响上传
        }
      }

      setFiles((prev) => [...prev, uploadedFile])

      // 异步上传文件
      try {
        const result = await uploadFile(file)

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  progress: 100,
                  status: result.success ? 'success' : 'error',
                  error: result.success ? undefined : result.error,
                  result,
                }
              : f,
          ),
        )
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  progress: 0,
                  status: 'error',
                  error: error instanceof Error ? error.message : '上传失败',
                }
              : f,
          ),
        )
      }
    }
  }

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles)
    }
    // 重置 input，允许重复选择同一文件
    e.target.value = ''
  }

  // 粘贴事件处理
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return

      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: Array<File> = []

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault()
        processFiles(imageFiles)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [disabled, processFiles])

  // 删除文件
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  // 点击触发文件选择
  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  // 获取文件图标
  const getFileIcon = (file: UploadedFile) => {
    if (file.thumbnailUrl) {
      return (
        <img
          src={file.thumbnailUrl}
          alt={file.name}
          className="h-10 w-10 rounded object-cover"
        />
      )
    }

    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />
    }

    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    }

    return <FileIcon className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 隐藏的文件输入 */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* 拖拽区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2',
          'rounded-lg border-2 border-dashed p-6',
          'cursor-pointer transition-colors duration-200',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Upload
          className={cn(
            'h-8 w-8',
            isDragging ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isDragging ? '释放以上传文件' : '拖拽文件到此处，或点击选择'}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            支持图片、PDF，单个文件最大 {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-2',
                file.status === 'error' &&
                  'border-destructive/50 bg-destructive/5',
              )}
            >
              {/* 文件图标/缩略图 */}
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                {file.status === 'uploading' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  getFileIcon(file)
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {file.status === 'uploading' && ` - 上传中...`}
                  {file.status === 'error' && (
                    <span className="text-destructive ml-2">{file.error}</span>
                  )}
                </p>
              </div>

              {/* 删除按钮 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
