import { ModelSelector } from '@/components/ModelSelector'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { useSession } from '@/stores/useSession'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileCode, Paperclip, TestTube2, X, Zap } from 'lucide-react'
import type React from 'react'
import { useRef, useState } from 'react'
import { ToolSelector, type Tool } from './ToolSelector'

const AVAILABLE_TOOLS: Tool[] = [
  {
    id: 'tavily-search',
    name: 'Search',
    description: 'Internet Access',
    icon: '🌐',
  },
  {
    id: 'calculator',
    name: 'Calc',
    description: 'Math Operations',
    icon: '🧮',
  },
]

interface ChatInputProps {
  onSend: (message: string, tools?: string[], files?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

// "System Suggestion Chips"
const QUICK_COMMANDS = [
  { id: 'api', label: '/测试API', icon: FileCode },
  { id: 'case', label: '/生成用例', icon: TestTube2 },
  { id: 'bug', label: '/分析BUG', icon: Zap },
]

const MAX_TEXTAREA_HEIGHT = 160

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const sessionType = useSession((s) => s.sessionType)
  const modelId = useSession((s) => s.modelId)
  const setModelId = useSession((s) => s.setModelId)

  const { draftMessage: message, setDraftMessage: setMessage, clearDraftMessage } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isFocused, setIsFocused] = useState(false)

  const handleToolToggle = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId],
    )
  }

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
      onSend(message.trim(), selectedTools, selectedFiles)
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

  return (
    <div className="w-full max-w-4xl mx-auto pb-6 px-4">
      {/* 1. Suggestion Chips (Visible when empty) */}
      <AnimatePresence>
        {!message && selectedFiles.length === 0 && !isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex gap-2 justify-center mb-4"
          >
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  setMessage(cmd.label + ' ')
                  textareaRef.current?.focus()
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-background/50 border border-border/50 hover:border-primary/50 text-xs font-mono text-muted-foreground transition-all hover:text-primary rounded-sm"
              >
                <cmd.icon className="h-3 w-3" />
                {cmd.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'relative transition-all duration-300 ease-out',
          isFocused ? 'scale-[1.01]' : 'scale-100',
        )}
      >
        {/* Glow effect */}
        <div
          className={cn(
            'absolute -inset-[1px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 rounded-lg opacity-0 transition-opacity duration-500',
            isFocused && 'opacity-100',
          )}
        />

        {/* HUD Container */}
        <div className="relative bg-black/80 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl overflow-hidden flex flex-col">
          {/* File Preview Strip (Horizontal) */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-3 p-3 overflow-x-auto bg-muted/20 border-b border-border/30"
              >
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group shrink-0 w-16 h-16 rounded-sm border border-border overflow-hidden bg-background"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeFile(index)}
                        className="text-white hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="flex items-end gap-2 p-3">
            {/* Left Actions (Attachment) */}
            <div className="flex gap-1 pb-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                placeholder || (sessionType === 'testcase' ? '输入需求文档...' : '输入指令...')
              }
              className="min-h-[24px] max-h-[200px] flex-1 bg-transparent border-0 p-1.5 focus-visible:ring-0 resize-none font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40"
              rows={1}
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />

            {/* Send Button */}
            <div className="pb-0.5">
              <Button
                onClick={handleSend}
                disabled={(!message.trim() && selectedFiles.length === 0) || disabled}
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-sm transition-all',
                  message.trim() || selectedFiles.length > 0
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_rgba(var(--primary),0.5)]'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {disabled ? (
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Footer / Status Bar (Tool Selectors) */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-t border-border/30 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-3">
              <ModelSelector
                currentModelId={modelId}
                onModelChange={setModelId}
                disabled={disabled}
              />

              <div className="h-3 w-px bg-border/50" />

              {sessionType === 'normal' && (
                <ToolSelector
                  tools={AVAILABLE_TOOLS}
                  selectedTools={selectedTools}
                  onToolToggle={handleToolToggle}
                />
              )}
            </div>

            <div className="flex items-center gap-1.5 opacity-60">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  disabled ? 'bg-red-500' : 'bg-emerald-500 animate-pulse',
                )}
              />
              <span>{disabled ? '处理中' : '就绪'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
