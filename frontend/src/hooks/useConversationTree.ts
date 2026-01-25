import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { TreeNode, TreeResponse } from '@/services/git'
import { gitService } from '@/services/git'

/**
 * 获取对话树结构
 */
export function useConversationTree(sessionId: string | undefined) {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())

  const query = useQuery<TreeResponse>({
    queryKey: ['conversation-tree', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID required')
      return gitService.getTree(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 30000,
  })

  // 选择/取消选择节点（最多选 2 个）
  const toggleNode = useCallback((checkpointId: string) => {
    setSelectedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(checkpointId)) {
        next.delete(checkpointId)
      } else {
        if (next.size >= 2) {
          // 移除最早选择的，添加新的
          const first = next.values().next().value
          if (first) next.delete(first)
        }
        next.add(checkpointId)
      }
      return next
    })
  }, [])

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set())
  }, [])

  // 获取选中的节点数据
  const getSelectedNodes = useCallback((): Array<TreeNode> => {
    if (!query.data) return []
    return query.data.nodes.filter((node) => selectedNodes.has(node.checkpointId))
  }, [query.data, selectedNodes])

  // 是否可以进行对比/合并（需要选中 2 个节点）
  const canCompare = selectedNodes.size === 2

  return {
    ...query,
    nodes: query.data?.nodes || [],
    selectedNodes,
    toggleNode,
    clearSelection,
    getSelectedNodes,
    canCompare,
  }
}
