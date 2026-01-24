import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard()

  const handleCopy = () => {
    copy(code)
  }

  // 从 className 提取语言（如 "language-typescript" -> "typescript"）
  const displayLanguage = language || className.replace('language-', '') || ''

  return (
    <div className="relative group rounded-lg overflow-hidden bg-[#0d1117] border border-border/30">
      {/* 头部：语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/30">
        <span className="text-xs text-muted-foreground font-mono">{displayLanguage || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 代码内容 */}
      <div className="overflow-x-auto">
        <pre className="p-4 m-0">
          <code
            className={`${className} block text-sm`}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}
