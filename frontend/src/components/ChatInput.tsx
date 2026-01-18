import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Paperclip, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type React from 'react'
import { ModelSelector } from '@/components/ModelSelector'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { useSession } from '@/stores/useSession'

interface ChatInputProps {
  onSend: (message: string, tools?: Array<string>, files?: Array<File>) => void
  disabled?: boolean
  placeholder?: string
}

const MAX_TEXTAREA_HEIGHT = 180

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const modelId = useSession((s) => s.modelId)
  const setModelId = useSession((s) => s.setModelId)

  const { draftMessage: message, setDraftMessage: setMessage, clearDraftMessage } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<Array<File>>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 4))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const adjustHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT) + 'px'
  }

  const handleSend = () => {
    if ((message.trim() || selectedFiles.length > 0) && !disabled) {
      onSend(message.trim(), undefined, selectedFiles)
      clearDraftMessage()
      setSelectedFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    adjustHeight(e.target)
  }

  const hasContent = message.trim() || selectedFiles.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto pb-8 px-4">
      {/* Neubrutalism container - thick border + hard shadow */}
      <div
        className={cn(
          'relative bg-background border-2 border-foreground overflow-hidden transition-shadow',
          'shadow-[4px_4px_0_0_hsl(var(--foreground))]',
          'hover:shadow-[6px_6px_0_0_hsl(var(--foreground))]',
        )}
      >
        {/* File Preview Strip */}
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-2 p-3 overflow-x-auto border-b-2 border-foreground bg-muted"
            >
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group shrink-0 w-16 h-16 border-2 border-foreground overflow-hidden bg-background"
                >
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute inset-0 bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <X className="h-5 w-5 text-background" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end gap-3 p-4">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 h-10 w-10 flex items-center justify-center border-2 border-foreground bg-background hover:bg-muted transition-colors cursor-pointer"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '输入消息...'}
            className="min-h-[40px] max-h-[180px] flex-1 bg-transparent border-0 p-2 focus:outline-none resize-none text-base leading-relaxed text-foreground placeholder:text-muted-foreground"
            rows={1}
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />

          {/* Send Button - Primary color */}
          <Button
            onClick={handleSend}
            disabled={!hasContent || disabled}
            size="icon"
            className={cn(
              'shrink-0 h-10 w-10 border-2 border-foreground transition-all',
              hasContent
                ? 'bg-primary text-primary-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0_0_hsl(var(--foreground))]'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {disabled ? (
              <div className="h-5 w-5 border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t-2 border-foreground bg-muted">
          <ModelSelector currentModelId={modelId} onModelChange={setModelId} disabled={disabled} />

          <span className="text-xs text-muted-foreground font-medium">Enter 发送</span>
        </div>
      </div>
    </div>
  )
}
