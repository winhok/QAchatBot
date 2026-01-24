'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { HTMLAttributes } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  code: string
  language?: string
  showCopyButton?: boolean
  maxHeight?: number
}

export function CodeBlock({
  code,
  language = 'json',
  showCopyButton = true,
  maxHeight,
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={cn('relative group rounded-md bg-muted/50', className)} {...props}>
      {showCopyButton && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-2 right-2 size-7',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            '[&>svg]:size-3.5',
          )}
          onClick={handleCopy}
          aria-label="复制代码"
        >
          {copied ? <Check className="text-emerald-500" /> : <Copy />}
          <span className="sr-only">{copied ? '已复制' : '复制代码'}</span>
        </Button>
      )}
      <pre
        className={cn(
          'p-3 text-xs overflow-x-auto font-mono text-foreground',
          maxHeight && 'overflow-y-auto',
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}
