import { motion } from 'framer-motion'
import { ExternalLink, GitMerge, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useMergeBranches } from '@/hooks/useMergeBranches'
import { cn } from '@/lib/utils'

interface MergeDialogProps {
  sessionId: string
  checkpointA: string
  checkpointB: string
  onClose: () => void
}

/**
 * 合并确认弹窗
 * 显示 AI 流式生成预览，确认后创建新 Session
 */
export function MergeDialog({ sessionId, checkpointA, checkpointB, onClose }: MergeDialogProps) {
  const [instruction, setInstruction] = useState('')
  const { merge, isLoading, streamedContent, error, newSessionId, navigateToNewSession } =
    useMergeBranches()

  const handleMerge = () => {
    merge({ sessionId, checkpointA, checkpointB }, instruction || undefined)
  }

  const handleNavigate = () => {
    navigateToNewSession()
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitMerge className="w-5 h-5 text-orange-500" />
            <h2 className="font-mono text-lg text-slate-200">合并分支</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X className="w-4 h-4" />
          </Button>
        </header>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
          {/* Branch Info */}
          <div className="flex gap-4 font-mono text-xs">
            <div className="flex-1 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
              <span className="text-blue-400">分支 A:</span>
              <span className="ml-2 text-slate-400">{checkpointA.slice(0, 12)}...</span>
            </div>
            <div className="flex-1 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
              <span className="text-cyan-400">分支 B:</span>
              <span className="ml-2 text-slate-400">{checkpointB.slice(0, 12)}...</span>
            </div>
          </div>

          {/* Instruction Input */}
          {!isLoading && !streamedContent && (
            <div>
              <label className="block mb-2 font-mono text-sm text-slate-400">
                合并指令（可选）
              </label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="例如：重点保留分支 A 的技术细节，同时融入分支 B 的创意…"
                className="bg-slate-800 border-slate-700 font-mono text-sm resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Streaming Content */}
          {(isLoading || streamedContent) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                <span>{isLoading ? 'AI 正在生成合并结果...' : '合并预览'}</span>
              </div>
              <div
                className={cn(
                  'p-4 bg-slate-800/50 border rounded font-mono text-sm text-slate-300 whitespace-pre-wrap max-h-60 overflow-auto',
                  isLoading ? 'border-orange-500/30' : 'border-green-500/30',
                )}
              >
                {streamedContent || '等待生成...'}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded font-mono text-sm text-red-400">
              错误: {error}
            </div>
          )}

          {/* Success */}
          {newSessionId && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
              <div className="font-mono text-sm text-green-400 mb-2">✓ 合并成功！</div>
              <div className="font-mono text-xs text-slate-400">新 Session ID: {newSessionId}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
          {newSessionId ? (
            <Button onClick={handleNavigate} className="bg-green-600 hover:bg-green-700 font-mono">
              <ExternalLink className="w-4 h-4 mr-2" />
              跳转到新对话
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="font-mono">
                取消
              </Button>
              <Button
                onClick={handleMerge}
                disabled={isLoading}
                className={cn(
                  'font-mono',
                  'bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <GitMerge className="w-4 h-4 mr-2" />
                    开始合并
                  </>
                )}
              </Button>
            </>
          )}
        </footer>
      </motion.div>
    </motion.div>
  )
}
