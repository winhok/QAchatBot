import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Paperclip } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type React from 'react'
import { DeepResearchToggle } from '@/components/chat/DeepResearchToggle'
import { ModelSelector } from '@/components/chat/ModelSelector'
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/common/attachments'
import { Loader } from '@/components/common/loader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { useSession } from '@/stores/useSession'

interface ChatInputProps {
  onSend: (
    message: string,
    options?: { tools?: Array<string>; files?: Array<File>; deepResearch?: boolean },
  ) => void
  disabled?: boolean
  placeholder?: string
}

const MAX_FILES = 4
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/*', 'application/pdf', 'text/*']
const MAX_TEXTAREA_HEIGHT = 180

const DEEP_RESEARCH_TOOLS = [
  'analyze_research_topic',
  'research_section',
  'generate_research_report',
]

interface FileWithPreview extends File {
  preview: string
  id: string
}

function matchesAccept(file: File, accept: Array<string>): boolean {
  return accept.some((pattern) => {
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.slice(0, -1))
    }
    return file.type === pattern
  })
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const modelId = useSession((s) => s.modelId)
  const setModelId = useSession((s) => s.setModelId)

  const { draftMessage: message, setDraftMessage: setMessage, clearDraftMessage } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<Array<FileWithPreview>>([])
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview))
    }
  }, [selectedFiles])

  const validateAndAddFiles = useCallback(
    (files: Array<File> | FileList) => {
      const incoming = Array.from(files)
      if (incoming.length === 0) return

      const accepted = incoming.filter((f) => matchesAccept(f, ACCEPTED_TYPES))
      if (incoming.length > 0 && accepted.length === 0) {
        toast.error('不支持的文件类型')
        return
      }

      const sizeValid = accepted.filter((f) => f.size <= MAX_FILE_SIZE)
      if (accepted.length > 0 && sizeValid.length === 0) {
        toast.error(`文件太大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
        return
      }

      const remaining = MAX_FILES - selectedFiles.length
      if (remaining <= 0) {
        toast.error(`最多只能上传 ${MAX_FILES} 个文件`)
        return
      }

      const toAdd = sizeValid.slice(0, remaining)
      if (sizeValid.length > remaining) {
        toast.warning(`仅添加了 ${toAdd.length} 个文件，已达上限`)
      }

      const filesWithPreview: Array<FileWithPreview> = toAdd.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }),
      )

      setSelectedFiles((prev) => [...prev, ...filesWithPreview])
    },
    [selectedFiles.length],
  )

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files) {
      validateAndAddFiles(e.target.files)
    }
    e.target.value = ''
  }

  function removeFile(id: string): void {
    setSelectedFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target) {
        URL.revokeObjectURL(target.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  function handleSend(): void {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && selectedFiles.length === 0) || disabled) return

    onSend(trimmedMessage, {
      tools: deepResearchEnabled ? DEEP_RESEARCH_TOOLS : undefined,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
      deepResearch: deepResearchEnabled,
    })
    clearDraftMessage()
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview))
    setSelectedFiles([])

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    setMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT) + 'px'
  }

  function handleDragEnter(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  function handleDragLeave(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files)
    }
  }

  function handlePaste(e: React.ClipboardEvent): void {
    const files = Array.from(e.clipboardData.files)
    if (files.length > 0) {
      e.preventDefault()
      validateAndAddFiles(files)
    }
  }

  const hasContent = message.trim() || selectedFiles.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto pb-8 px-4">
      <div
        ref={containerRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative bg-background border-2 border-foreground overflow-hidden transition-all',
          'shadow-[4px_4px_0_0_hsl(var(--foreground))]',
          'hover:shadow-[6px_6px_0_0_hsl(var(--foreground))]',
          isDragOver && 'ring-2 ring-primary ring-offset-2 border-primary',
        )}
      >
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-primary/10 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-primary font-bold text-lg">释放以添加文件</div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b-2 border-foreground bg-muted p-3"
            >
              <Attachments variant="grid">
                {selectedFiles.map((file) => (
                  <Attachment
                    key={file.id}
                    data={{
                      id: file.id,
                      url: file.preview,
                      filename: file.name,
                      mediaType: file.type,
                    }}
                    onRemove={() => removeFile(file.id)}
                  >
                    <AttachmentPreview />
                    <AttachmentRemove />
                  </Attachment>
                ))}
              </Attachments>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3 p-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 h-10 w-10 flex items-center justify-center border-2 border-foreground bg-background hover:bg-muted transition-colors cursor-pointer"
            aria-label="添加附件"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder || '输入消息...'}
            className="min-h-[40px] max-h-[180px] flex-1 bg-transparent border-0 p-2 focus:outline-none resize-none text-base leading-relaxed text-foreground placeholder:text-muted-foreground"
            rows={1}
            aria-label="消息输入框"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            aria-label="选择文件"
          />

          <Button
            onClick={handleSend}
            disabled={!hasContent || disabled}
            size="icon"
            aria-label={disabled ? '发送中' : '发送消息'}
            className={cn(
              'shrink-0 h-10 w-10 border-2 border-foreground transition-all',
              hasContent
                ? 'bg-primary text-primary-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0_0_hsl(var(--foreground))]'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {disabled ? <Loader size={20} /> : <ArrowUp className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t-2 border-foreground bg-muted">
          <div className="flex items-center gap-2">
            <ModelSelector
              currentModelId={modelId}
              onModelChange={setModelId}
              disabled={disabled}
            />
            <DeepResearchToggle
              enabled={deepResearchEnabled}
              onToggle={setDeepResearchEnabled}
              disabled={disabled}
            />
          </div>

          <span className="text-xs text-muted-foreground font-medium">Enter 发送</span>
        </div>
      </div>
    </div>
  )
}
