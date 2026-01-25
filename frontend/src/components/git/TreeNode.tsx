import { motion } from 'framer-motion'
import { Bot, Check, User } from 'lucide-react'
import type { TreeNode as TreeNodeType } from '@/services/git'
import { cn } from '@/lib/utils'

interface TreeNodeProps {
  node: TreeNodeType
  isSelected: boolean
  onClick: () => void
  isFirst?: boolean
}

/**
 * 对话树单个节点
 * Cyberpunk 风格：neon glow + 终端感
 */
export function TreeNode({ node, isSelected, onClick, isFirst = false }: TreeNodeProps) {
  const isUser = node.role === 'user'

  function getNodeStyle(): string {
    if (isSelected) {
      return 'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
    }
    if (isUser) {
      return 'border-blue-400 bg-blue-500/10 group-hover:shadow-[0_0_10px_rgba(96,165,250,0.4)]'
    }
    return 'border-cyan-400 bg-cyan-500/10 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.4)]'
  }

  function renderIcon() {
    if (isSelected) {
      return <Check className="w-4 h-4 text-orange-500" />
    }
    if (isUser) {
      return <User className="w-4 h-4 text-blue-400" />
    }
    return <Bot className="w-4 h-4 text-cyan-400" />
  }

  return (
    <motion.button
      type="button"
      className="relative flex flex-col items-center cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 连接线 */}
      {!isFirst && (
        <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500/50 to-blue-400" />
      )}

      {/* 节点圆圈 */}
      <div
        className={cn(
          'relative w-10 h-10 rounded-full flex items-center justify-center',
          'border-2 transition-all duration-200',
          'font-mono text-xs',
          getNodeStyle(),
        )}
      >
        {renderIcon()}

        {/* 消息数量徽章 */}
        <span
          className={cn(
            'absolute -top-1 -right-1 min-w-4 h-4 px-1',
            'flex items-center justify-center',
            'text-[10px] font-bold rounded-full',
            'bg-slate-700 text-slate-300 border border-slate-600',
          )}
        >
          {node.messageCount}
        </span>
      </div>

      {/* 预览文本 */}
      <div
        className={cn(
          'mt-2 max-w-24 text-center',
          'text-xs font-mono text-slate-400 truncate',
          'opacity-0 group-hover:opacity-100 transition-opacity',
        )}
        title={node.preview}
      >
        {node.preview || '...'}
      </div>

      {/* 时间戳 */}
      <div className="mt-1 text-[10px] font-mono text-slate-600">
        {new Date(node.createdAt).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </motion.button>
  )
}
