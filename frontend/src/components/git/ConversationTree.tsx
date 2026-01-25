import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, GitBranch, GitMerge, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BranchDiff } from './BranchDiff'
import { MergeDialog } from './MergeDialog'
import { TreeNode } from './TreeNode'
import type { TreeNode as TreeNodeType } from '@/services/git'
import { cn } from '@/lib/utils'
import { useConversationTree } from '@/hooks/useConversationTree'
import { Button } from '@/components/ui/button'

interface ConversationTreeProps {
  sessionId: string
  onClose: () => void
  onCheckpointSelect?: (checkpointId: string) => void
}

interface TreeLevel {
  nodes: Array<TreeNodeType>
  parentId: string | null
}

/**
 * 全屏对话树视图
 * Cyberpunk UI 风格：深色背景 + neon 高亮 + 终端字体
 */
export function ConversationTree({
  sessionId,
  onClose,
  onCheckpointSelect,
}: ConversationTreeProps) {
  const { nodes, isLoading, selectedNodes, toggleNode, clearSelection, canCompare } =
    useConversationTree(sessionId)

  const [showDiff, setShowDiff] = useState(false)
  const [showMerge, setShowMerge] = useState(false)

  // 构建树层级结构
  const treeLevels = useMemo(() => {
    if (!nodes.length) return []

    // 按 parentCheckpointId 分组
    const childrenMap = new Map<string | null, Array<TreeNodeType>>()

    for (const node of nodes) {
      const parentId = node.parentCheckpointId
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, [])
      }
      childrenMap.get(parentId)!.push(node)
    }

    // BFS 遍历构建层级
    const levels: Array<TreeLevel> = []
    let currentLevel: Array<TreeNodeType> = childrenMap.get(null) || []

    while (currentLevel.length > 0) {
      levels.push({ nodes: currentLevel, parentId: null })

      const nextLevel: Array<TreeNodeType> = []
      for (const node of currentLevel) {
        const children = childrenMap.get(node.checkpointId) || []
        nextLevel.push(...children)
      }
      currentLevel = nextLevel
    }

    return levels
  }, [nodes])

  // 获取选中的两个节点 ID
  const selectedArray = Array.from(selectedNodes)
  const [checkpointA, checkpointB] = selectedArray

  const handleCompare = () => {
    if (canCompare) {
      setShowDiff(true)
    }
  }

  const handleMerge = () => {
    if (canCompare) {
      setShowMerge(true)
    }
  }

  const handleNodeClick = (checkpointId: string) => {
    toggleNode(checkpointId)
  }

  const handleNodeDoubleClick = (checkpointId: string) => {
    onCheckpointSelect?.(checkpointId)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 h-14 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回对话
            </Button>
            <div className="h-4 w-px bg-slate-700" />
            <h1 className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-400" />
              对话树
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        {/* Tree Content */}
        <main className="absolute inset-x-0 top-14 bottom-16 overflow-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 font-mono">
              暂无分支历史
            </div>
          ) : (
            <div className="min-w-max">
              {/* 时间线 */}
              {treeLevels.map((level, levelIndex) => (
                <div key={levelIndex} className="flex items-center gap-8 mb-12">
                  {/* 层级标签 */}
                  <div className="w-16 text-right font-mono text-xs text-slate-600">
                    L{levelIndex + 1}
                  </div>

                  {/* 节点 */}
                  <div className="flex items-center gap-8">
                    {level.nodes.map((node, nodeIndex) => (
                      <div
                        key={node.checkpointId}
                        onDoubleClick={() => handleNodeDoubleClick(node.checkpointId)}
                      >
                        <TreeNode
                          node={node}
                          isSelected={selectedNodes.has(node.checkpointId)}
                          onClick={() => handleNodeClick(node.checkpointId)}
                          isFirst={nodeIndex === 0 && levelIndex === 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer Actions */}
        <footer className="absolute bottom-0 left-0 right-0 h-16 px-6 flex items-center justify-between border-t border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="text-sm font-mono text-slate-500">
            已选择 {selectedNodes.size} / 2 个节点
            {selectedNodes.size > 0 && (
              <button
                onClick={clearSelection}
                className="ml-3 text-slate-400 hover:text-slate-200 underline"
              >
                清空选择
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={!canCompare}
              onClick={handleCompare}
              className={cn(
                'font-mono',
                canCompare && 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10',
              )}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              对比分支
            </Button>

            <Button
              disabled={!canCompare}
              onClick={handleMerge}
              className={cn(
                'font-mono',
                canCompare &&
                  'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]',
              )}
            >
              <GitMerge className="w-4 h-4 mr-2" />
              合并分支
            </Button>
          </div>
        </footer>

        {/* Diff Dialog */}
        {showDiff && checkpointA && checkpointB && (
          <BranchDiff
            sessionId={sessionId}
            checkpointA={checkpointA}
            checkpointB={checkpointB}
            onClose={() => setShowDiff(false)}
          />
        )}

        {/* Merge Dialog */}
        {showMerge && checkpointA && checkpointB && (
          <MergeDialog
            sessionId={sessionId}
            checkpointA={checkpointA}
            checkpointB={checkpointB}
            onClose={() => setShowMerge(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
