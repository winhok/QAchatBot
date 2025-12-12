'use client'

import { Terminal, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ToolCallBlockProps {
  toolName: string
  input: string | Record<string, unknown>
  output?: string | Record<string, unknown>
  status?: 'pending' | 'success' | 'error'
}

export function ToolCallBlock({ toolName, input, output, status = 'success' }: ToolCallBlockProps) {
  const [copiedInput, setCopiedInput] = useState(false)
  const [copiedOutput, setCopiedOutput] = useState(false)

  const formatData = (data: string | Record<string, unknown>) => {
    if (typeof data === 'string') return data
    return JSON.stringify(data, null, 2)
  }

  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const statusColors = {
    pending: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    error: 'from-red-500/20 to-pink-500/20 border-red-500/30',
  }

  const statusIcons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  }

  return (
    <div className={`backdrop-blur-md bg-gradient-to-br ${statusColors[status]} border rounded-2xl p-4 my-2 shadow-lg`}>
      <div className='flex items-center gap-2 mb-3'>
        <Terminal className='h-4 w-4 text-purple-300' />
        <span className='text-sm font-semibold text-white'>{toolName}</span>
        <span className='text-xs'>{statusIcons[status]}</span>
      </div>

      <div className='space-y-3'>
        {/* Input Section */}
        <div className='relative'>
          <div className='flex items-center justify-between mb-1'>
            <span className='text-xs text-purple-200 font-medium'>输入</span>
            <button
              onClick={() => copyToClipboard(formatData(input), setCopiedInput)}
              className='text-purple-300 hover:text-purple-100 transition-colors duration-200 p-1'
              aria-label='复制输入'
            >
              {copiedInput ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
          <div className='bg-black/30 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar'>
            <pre className='text-xs font-mono text-green-200 whitespace-pre-wrap break-words'>{formatData(input)}</pre>
          </div>
        </div>

        {/* Output Section */}
        {output !== undefined && (
          <div className='relative'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs text-purple-200 font-medium'>输出</span>
              <button
                onClick={() => copyToClipboard(formatData(output), setCopiedOutput)}
                className='text-purple-300 hover:text-purple-100 transition-colors duration-200 p-1'
                aria-label='复制输出'
              >
                {copiedOutput ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
              </button>
            </div>
            <div className='bg-black/30 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar'>
              <pre className='text-xs font-mono text-cyan-200 whitespace-pre-wrap break-words'>{formatData(output)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
