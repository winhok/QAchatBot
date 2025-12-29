import { Check, Clock, Copy } from 'lucide-react'
import { useState } from 'react'
import type { ApiResultData } from '@/schemas'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ApiResultBlockProps {
  data: ApiResultData
}

export function ApiResultBlock({ data }: ApiResultBlockProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')

  const getMethodColor = () => {
    switch (data.method) {
      case 'GET':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'POST':
        return 'bg-blue-500/20 text-blue-400'
      case 'PUT':
        return 'bg-amber-500/20 text-amber-400'
      case 'DELETE':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-purple-500/20 text-purple-400'
    }
  }

  const getStatusColor = () => {
    if (data.statusCode >= 200 && data.statusCode < 300)
      return 'text-emerald-400'
    if (data.statusCode >= 400) return 'text-red-400'
    return 'text-amber-400'
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data.responseBody, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/50 bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge
            variant="secondary"
            className={cn('shrink-0 border-0', getMethodColor())}
          >
            {data.method}
          </Badge>
          <span className="text-sm text-muted-foreground truncate font-mono">
            {data.url}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span
            className={cn('font-mono text-sm font-medium', getStatusColor())}
          >
            {data.statusCode}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{data.duration}ms</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveTab('body')}
          className={cn(
            'px-4 py-2 text-xs font-medium transition-colors',
            activeTab === 'body'
              ? 'text-foreground border-b-2 border-emerald-500'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Response Body
        </button>
        {data.headers && (
          <button
            onClick={() => setActiveTab('headers')}
            className={cn(
              'px-4 py-2 text-xs font-medium transition-colors',
              activeTab === 'headers'
                ? 'text-foreground border-b-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Headers
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <pre className="p-3 text-xs text-foreground overflow-x-auto max-h-64 font-mono">
          {activeTab === 'body'
            ? JSON.stringify(data.responseBody, null, 2)
            : JSON.stringify(data.headers, null, 2)}
        </pre>
      </div>
    </Card>
  )
}
