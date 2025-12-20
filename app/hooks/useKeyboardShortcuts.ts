'use client'

// TODO: 键盘快捷键 Hook
// 功能需求：
// 1. Cmd/Ctrl + K: 打开全局搜索
// 2. Cmd/Ctrl + N: 新建会话
// 3. Cmd/Ctrl + Shift + S: 导出当前对话
// 4. Escape: 停止生成 / 关闭弹窗
// 5. Cmd/Ctrl + /: 打开帮助/设置
// 6. 上下键: 历史消息导航（可选）
// 7. 支持自定义快捷键配置

import { useEffect, useCallback } from 'react'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: ShortcutConfig[]
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  // TODO: 实现快捷键监听
  // - 监听 keydown 事件
  // - 匹配快捷键配置
  // - 阻止默认行为
  // - 执行对应 action

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // TODO: 实现快捷键匹配逻辑
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, shortcuts])
}

// 预设的默认快捷键
export const defaultShortcuts: Omit<ShortcutConfig, 'action'>[] = [
  { key: 'k', ctrl: true, description: '打开搜索' },
  { key: 'n', ctrl: true, description: '新建会话' },
  { key: 's', ctrl: true, shift: true, description: '导出对话' },
  { key: 'Escape', description: '停止生成/关闭弹窗' },
  { key: '/', ctrl: true, description: '打开帮助' },
]
