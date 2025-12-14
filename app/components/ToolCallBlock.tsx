'use client'

import { Badge } from '@/app/components/ui/badge'
import { Card } from '@/app/components/ui/card'
import { cn } from '@/app/lib/utils'
import type { ToolCallData } from '@/app/types/messages'
import { CheckCircle, ChevronDown, ChevronRight, Clock, Database, Globe, Loader2, Wrench, XCircle } from 'lucide-react'
import { useState } from 'react'

interface ToolCallBlockProps {
  data: ToolCallData
}

export function ToolCallBlock({ data }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false)

  const getIcon = () => {
    switch (data.type) {
      case 'api':
        return <Globe className='h-4 w-4' />
      case 'database':
        return <Database className='h-4 w-4' />
      default:
        return <Wrench className='h-4 w-4' />
    }
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-400' />
      case 'success':
        return <CheckCircle className='h-4 w-4 text-emerald-400' />
      case 'error':
        return <XCircle className='h-4 w-4 text-red-400' />
    }
  }

  const getStatusBadge = () => {
    switch (data.status) {
      case 'running':
        return (
          <Badge variant='secondary' className='bg-blue-500/20 text-blue-400 border-0'>
            运行中
          </Badge>
        )
      case 'success':
        return (
          <Badge variant='secondary' className='bg-emerald-500/20 text-emerald-400 border-0'>
            成功
          </Badge>
        )
      case 'error':
        return (
          <Badge variant='secondary' className='bg-red-500/20 text-red-400 border-0'>
            失败
          </Badge>
        )
    }
  }

  return (
    <Card className='border-border/50 bg-card/30 overflow-hidden'>
      <button onClick={() => setExpanded(!expanded)} className='flex w-full items-center justify-between p-3 hover:bg-accent/50 transition-colors'>
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground'>{getIcon()}</div>
          <div className='text-left'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-sm text-foreground'>{data.name}</span>
              {getStatusBadge()}
            </div>
            {data.duration && (
              <div className='flex items-center gap-1 text-xs text-muted-foreground mt-0.5'>
                <Clock className='h-3 w-3' />
                <span>{data.duration}ms</span>
              </div>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {getStatusIcon()}
          {expanded ? <ChevronDown className='h-4 w-4 text-muted-foreground' /> : <ChevronRight className='h-4 w-4 text-muted-foreground' />}
        </div>
      </button>

      {expanded && (data.input || data.output) && (
        <div className='border-t border-border/50 bg-muted/20'>
          {data.input && (
            <div className='p-3 border-b border-border/30'>
              <div className='text-xs font-medium text-muted-foreground mb-2'>输入参数</div>
              <pre className='text-xs text-foreground bg-background/50 rounded p-2 overflow-x-auto'>{JSON.stringify(data.input, null, 2)}</pre>
            </div>
          )}
          {data.output && (
            <div className='p-3'>
              <div className='text-xs font-medium text-muted-foreground mb-2'>返回结果</div>
              <pre
                className={cn(
                  'text-xs rounded p-2 overflow-x-auto',
                  data.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-background/50 text-foreground'
                )}
              >
                {JSON.stringify(data.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
