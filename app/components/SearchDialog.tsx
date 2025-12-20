'use client'

// TODO: 全局搜索对话框组件
// 功能需求：
// 1. Cmd+K / Ctrl+K 快捷键唤起
// 2. 搜索会话名称和消息内容
// 3. 实时搜索结果展示
// 4. 键盘导航（上下键选择，Enter 跳转）
// 5. 高亮匹配关键词
// 6. 参考 VSCode/Notion 的命令面板设计

import { useState } from 'react'

interface SearchResult {
  type: 'session' | 'message'
  sessionId: string
  title: string
  content: string
  highlight: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // TODO: 实现搜索功能
  // - 防抖处理输入
  // - 调用搜索 API
  // - 处理键盘导航
  // - 点击/Enter 跳转到对应会话

  return (
    <div>
      {/* TODO: 使用 Dialog 组件 */}
      {/* TODO: 搜索输入框 */}
      {/* TODO: 搜索结果列表 */}
    </div>
  )
}
