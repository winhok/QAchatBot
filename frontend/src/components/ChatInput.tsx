import { ModelSelector } from '@/components/ModelSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { useSession } from '@/stores/useSession'
import {
  ArrowUp,
  Bug,
  FileCode,
  MessageSquare,
  Paperclip,
  Plus,
  Sparkles,
  TestTube2,
  X,
} from 'lucide-react'
import type React from 'react'
import { useRef, useState } from 'react'
import { ToolSelector, type Tool } from './ToolSelector'

// TODO: Move this to a shared config or fetch from API
const AVAILABLE_TOOLS: Tool[] = [
  {
    id: 'tavily-search',
    name: '联网搜索',
    description: '使用 Tavily 搜索互联网获取最新信息',
    icon: '🔍',
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '执行数学计算',
    icon: '🧮',
  },
]

interface ChatInputProps {
  onSend: (message: string, tools?: string[], files?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

const quickActions = [
  { icon: FileCode, label: '测试接口', prompt: '帮我测试以下接口：' },
  {
    icon: TestTube2,
    label: '生成测试用例',
    prompt: '帮我生成以下功能的测试用例：',
  },
  { icon: Bug, label: '分析 Bug', prompt: '帮我分析以下错误日志：' },
]

const MAX_TEXTAREA_HEIGHT = 128

const SESSION_THEME = {
  normal: {
    label: '普通聊天',
    icon: MessageSquare,
    glowClass: 'from-emerald-500/20 to-teal-500/20',
    buttonClass:
      'bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40',
    accentColor: 'text-emerald-400',
    badgeVariant: 'success' as const,
    hint: '支持自然语言对话，AI 将为您提供专业解答',
  },
  testcase: {
    label: '测试设计',
    icon: TestTube2,
    glowClass: 'from-teal-500/30 to-cyan-500/30',
    buttonClass:
      'bg-linear-to-br from-teal-500 to-cyan-600 shadow-teal-500/25 hover:shadow-teal-500/40',
    accentColor: 'text-teal-400',
    badgeVariant: 'teal' as const,
    hint: '支持 Human-in-the-Loop 模式，每个阶段可审核修改',
  },
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const sessionType = useSession((s) => s.sessionType)
  const modelId = useSession((s) => s.modelId)
  const setModelId = useSession((s) => s.setModelId)

  const theme = SESSION_THEME[sessionType] || SESSION_THEME.normal
  const ThemeIcon = theme.icon

  const { draftMessage: message, setDraftMessage: setMessage, clearDraftMessage } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleToolToggle = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId],
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      // Limit to 4 images
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

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="border-t border-border/50 bg-linear-to-t from-background to-background/80 p-4 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl">
        <div className="relative group">
          {/* Glow Effect - 根据模式变化 */}
          <div
            className={cn(
              'absolute -inset-0.5 rounded-2xl bg-linear-to-r opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100',
              theme.glowClass,
            )}
          />

          {/* Image Previews */}
          {selectedFiles.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full flex gap-2 overflow-x-auto px-1 py-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group/preview shrink-0">
                  <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Container */}
          <div className="relative flex items-end gap-2 rounded-2xl border border-border/50 bg-card/80 p-2 shadow-lg backdrop-blur">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent h-10 w-10"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {quickActions.map((action) => (
                  <DropdownMenuItem key={action.label} onClick={() => setMessage(action.prompt)}>
                    <action.icon className={cn('mr-2 h-4 w-4', theme.accentColor)} />
                    {action.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFileUpload}>
                  <Paperclip className="mr-2 h-4 w-4" />
                  上传图片
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
              multiple
            />

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={
                placeholder ||
                (sessionType === 'testcase'
                  ? '输入 PRD 需求文档，AI 将分阶段生成测试用例...'
                  : '输入内容，让 AI 助手帮你完成...')
              }
              className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent p-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              rows={1}
              style={{ maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
            />

            {/* 发送按钮 - 根据模式变化主题色 */}
            <Button
              onClick={handleSend}
              disabled={(!message.trim() && selectedFiles.length === 0) || disabled}
              size="icon"
              className={cn(
                'shrink-0 rounded-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:shadow-none disabled:scale-100 h-10 w-10',
                theme.buttonClass,
              )}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Footer hint - 显示当前模式徽章和提示 */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ModelSelector
              currentModelId={modelId}
              onModelChange={setModelId}
              disabled={disabled}
            />
            {sessionType === 'normal' && (
              <ToolSelector
                tools={AVAILABLE_TOOLS}
                selectedTools={selectedTools}
                onToolToggle={handleToolToggle}
              />
            )}
            <Badge variant={theme.badgeVariant} size="sm" className="gap-1">
              <ThemeIcon className="h-3 w-3" />
              {theme.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className={cn('h-3 w-3', theme.accentColor)} />
            <span>{theme.hint}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
