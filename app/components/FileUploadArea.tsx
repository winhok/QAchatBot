'use client'

// TODO: 文件上传/附件预览组件
// 功能需求：
// 1. 拖拽上传文件
// 2. 点击选择文件
// 3. 粘贴图片上传（Ctrl+V）
// 4. 支持多文件上传
// 5. 文件类型限制（图片、文档、代码文件等）
// 6. 上传进度显示
// 7. 预览已上传文件（图片缩略图、文件图标）
// 8. 删除已上传文件
// 9. 文件大小限制提示
// 10. 参考 GPT/Gemini 的附件上传体验

import { useState, useRef, useCallback } from 'react'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string        // 预览 URL（图片）
  progress: number    // 上传进度 0-100
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface FileUploadAreaProps {
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number    // 单文件最大大小（字节）
  acceptedTypes?: string[]  // 接受的 MIME 类型
  disabled?: boolean
}

export function FileUploadArea({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,  // 默认 10MB
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', 'application/json'],
  disabled = false,
}: FileUploadAreaProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // TODO: 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // TODO: 设置 isDragging 状态
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // TODO: 重置 isDragging 状态
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // TODO: 处理拖拽的文件
    // - 获取 e.dataTransfer.files
    // - 验证文件类型和大小
    // - 上传文件
  }, [])

  // TODO: 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: 处理选择的文件
  }, [])

  // TODO: 处理粘贴事件（图片）
  const handlePaste = useCallback((e: ClipboardEvent) => {
    // TODO: 从剪贴板获取图片
    // - 检查 e.clipboardData.items
    // - 找到图片类型的 item
    // - 转换为 File 对象并上传
  }, [])

  // TODO: 上传单个文件
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    // TODO: 实现文件上传
    // - 创建 FormData
    // - 发送到上传 API
    // - 更新进度
    // - 返回上传结果
    return {} as UploadedFile
  }

  // TODO: 删除文件
  const removeFile = useCallback((fileId: string) => {
    // TODO: 从列表中移除文件
    // - 如果正在上传，取消上传
    // - 更新 files 状态
    // - 调用 onFilesChange
  }, [])

  // TODO: 点击触发文件选择
  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div>
      {/* TODO: 隐藏的 file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* TODO: 拖拽区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* TODO: 拖拽提示 UI */}
        {/* TODO: 拖拽中的高亮状态 */}
      </div>

      {/* TODO: 已上传文件列表 */}
      <div>
        {files.map(file => (
          <div key={file.id}>
            {/* TODO: 文件预览卡片 */}
            {/* - 图片显示缩略图 */}
            {/* - 其他文件显示图标 */}
            {/* - 上传进度条 */}
            {/* - 删除按钮 */}
          </div>
        ))}
      </div>
    </div>
  )
}
