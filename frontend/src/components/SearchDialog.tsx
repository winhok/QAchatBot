import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Clock, MessageSquare, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSessions } from '@/hooks/useSessions'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: 'session'
  id: string
  title: string
  subtitle?: string
  timestamp?: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate()
  const { data: sessions = [] } = useSessions()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 搜索结果
  const results = ((): Array<SearchResult> => {
    if (!query.trim()) {
      // 无搜索词时，显示最近的会话
      return sessions.slice(0, 10).map((session) => ({
        type: 'session',
        id: session.id,
        title: session.name || `会话 ${session.id.slice(0, 8)}`,
        subtitle: session.type === 'testcase' ? '测试设计' : '普通聊天',
        timestamp: session.created_at,
      }))
    }

    const lowerQuery = query.toLowerCase()

    // 搜索会话名称
    const matchedSessions = sessions
      .filter((session) => {
        const name = session.name || session.id
        return name.toLowerCase().includes(lowerQuery)
      })
      .map((session) => ({
        type: 'session' as const,
        id: session.id,
        title: session.name || `会话 ${session.id.slice(0, 8)}`,
        subtitle: session.type === 'testcase' ? '测试设计' : '普通聊天',
        timestamp: session.created_at,
      }))

    return matchedSessions.slice(0, 20)
  })()

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // 清理状态
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onOpenChange(false)
        break
    }
  }

  // 选择结果
  const handleSelect = (result: SearchResult) => {
    onOpenChange(false)
    navigate({ to: '/$threadId', params: { threadId: result.id } })
  }

  // 高亮匹配文本
  const highlightMatch = (text: string, searchStr: string) => {
    if (!searchStr.trim()) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = searchStr.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {text.slice(index, index + searchStr.length)}
        </span>
        {text.slice(index + searchStr.length)}
      </>
    )
  }

  // 格式化时间
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()

      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

      return date.toLocaleDateString('zh-CN')
    } catch {
      return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>搜索会话</DialogTitle>
        </DialogHeader>

        {/* 搜索输入框 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索会话..."
            className="border-0 p-0 h-auto text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* 搜索结果 */}
        <ScrollArea className="max-h-[400px]">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">{query ? '未找到匹配的会话' : '暂无会话记录'}</p>
            </div>
          ) : (
            <div className="p-2">
              {!query && (
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  最近会话
                </div>
              )}
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                    'transition-colors',
                    selectedIndex === index
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50',
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{highlightMatch(result.title, query)}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  {result.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTime(result.timestamp)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 快捷键提示 */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd> 导航
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> 选择
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> 关闭
            </span>
          </div>
          <span>{results.length} 个结果</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
