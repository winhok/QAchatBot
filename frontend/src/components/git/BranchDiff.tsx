import { motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBranchDiff } from '@/hooks/useBranchDiff'
import { cn } from '@/lib/utils'

interface BranchDiffProps {
  sessionId: string
  checkpointA: string
  checkpointB: string
  onClose: () => void
}

/**
 * 并排对比两个分支的消息内容
 * Cyberpunk 风格的 diff 视图
 */
export function BranchDiff({ sessionId, checkpointA, checkpointB, onClose }: BranchDiffProps) {
  const { data, isLoading, error } = useBranchDiff(sessionId, checkpointA, checkpointB)

  return (
    <motion.div
      className="fixed inset-0 z-60 bg-slate-950/98 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-12 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/80">
        <h2 className="text-sm font-mono text-slate-300">分支对比</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
          <X className="w-4 h-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="absolute inset-x-0 top-12 bottom-0 flex">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 font-mono text-sm">
            加载失败: {error.message}
          </div>
        ) : data ? (
          <>
            {/* Branch A */}
            <div className="flex-1 border-r border-slate-800 overflow-auto">
              <div className="sticky top-0 px-4 py-2 bg-blue-500/10 border-b border-blue-500/30 font-mono text-xs text-blue-400">
                分支 A - {checkpointA.slice(0, 8)}...
              </div>
              <div className="p-4 space-y-4">
                {data.branchA.messages.map((msg, i) => (
                  <MessageBlock key={i} role={msg.role} content={msg.content} variant="a" />
                ))}
              </div>
            </div>

            {/* Branch B */}
            <div className="flex-1 overflow-auto">
              <div className="sticky top-0 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/30 font-mono text-xs text-cyan-400">
                分支 B - {checkpointB.slice(0, 8)}...
              </div>
              <div className="p-4 space-y-4">
                {data.branchB.messages.map((msg, i) => (
                  <MessageBlock key={i} role={msg.role} content={msg.content} variant="b" />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Common Ancestor Info */}
      {data?.commonAncestor && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800/80 rounded-full font-mono text-xs text-slate-400 border border-slate-700">
          共同祖先: {data.commonAncestor.slice(0, 12)}...
        </div>
      )}
    </motion.div>
  )
}

interface MessageBlockProps {
  role: string
  content: string
  variant: 'a' | 'b'
}

function MessageBlock({ role, content, variant }: MessageBlockProps) {
  const isUser = role === 'user'

  function getBlockStyle(): string {
    if (isUser) {
      return 'bg-slate-800/50 border border-slate-700'
    }
    if (variant === 'a') {
      return 'bg-blue-500/5 border border-blue-500/20'
    }
    return 'bg-cyan-500/5 border border-cyan-500/20'
  }

  function getLabelStyle(): string {
    if (isUser) {
      return 'text-slate-500'
    }
    if (variant === 'a') {
      return 'text-blue-400'
    }
    return 'text-cyan-400'
  }

  return (
    <div className={cn('p-3 rounded-lg font-mono text-sm', getBlockStyle())}>
      <div className={cn('text-xs mb-2', getLabelStyle())}>{isUser ? '用户' : '助手'}</div>
      <div className="text-slate-300 whitespace-pre-wrap">{content}</div>
    </div>
  )
}
