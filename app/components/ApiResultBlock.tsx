'use client'

import { Check, ChevronDown, ChevronUp, Copy, Database } from 'lucide-react'
import { useState } from 'react'

interface ApiResultBlockProps {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  statusCode?: number
  responseTime?: number
  data: string | Record<string, unknown>
}

export function ApiResultBlock({ endpoint, method = 'GET', statusCode = 200, responseTime, data }: ApiResultBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const formatData = (data: string | Record<string, unknown>) => {
    if (typeof data === 'string') return data
    return JSON.stringify(data, null, 2)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-400'
    if (code >= 400 && code < 500) return 'text-yellow-400'
    if (code >= 500) return 'text-red-400'
    return 'text-blue-400'
  }

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'POST':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'PUT':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'DELETE':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'PATCH':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formattedData = formatData(data)
  const dataLines = formattedData.split('\n')
  const shouldCollapse = dataLines.length > 10

  return (
    <div className='backdrop-blur-md bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-white/20 rounded-2xl p-4 my-2 shadow-lg'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Database className='h-4 w-4 text-purple-300' />
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${getMethodColor(method)}`}>{method}</span>
          <span className='text-xs text-purple-200 font-mono truncate max-w-xs'>{endpoint}</span>
        </div>
        <div className='flex items-center gap-2'>
          {responseTime && <span className='text-xs text-purple-300'>{responseTime}ms</span>}
          <span className={`text-xs font-semibold ${getStatusColor(statusCode)}`}>{statusCode}</span>
        </div>
      </div>

      <div className='relative'>
        <div className='flex items-center justify-between mb-1'>
          <span className='text-xs text-purple-200 font-medium'>响应数据</span>
          <div className='flex items-center gap-1'>
            {shouldCollapse && (
              <button
                onClick={() => setExpanded(!expanded)}
                className='text-purple-300 hover:text-purple-100 transition-colors duration-200 p-1 flex items-center gap-1'
                aria-label={expanded ? '收起' : '展开'}
              >
                <span className='text-xs'>{expanded ? '收起' : '展开'}</span>
                {expanded ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
              </button>
            )}
            <button
              onClick={() => copyToClipboard(formattedData)}
              className='text-purple-300 hover:text-purple-100 transition-colors duration-200 p-1'
              aria-label='复制响应'
            >
              {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
        </div>
        <div
          className={`bg-black/30 rounded-lg p-3 overflow-y-auto custom-scrollbar transition-all duration-300 ${
            expanded || !shouldCollapse ? 'max-h-96' : 'max-h-32'
          }`}
        >
          <pre className='text-xs font-mono text-cyan-200 whitespace-pre-wrap wrap-break-word'>{formattedData}</pre>
        </div>
      </div>
    </div>
  )
}
