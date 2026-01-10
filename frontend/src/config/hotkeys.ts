/**
 * 热键 ID 类型
 *
 * 所有可用的热键标识符
 */
export type HotkeyId =
  | 'newSession'
  | 'search'
  | 'export'
  | 'stopGeneration'
  | 'sendMessage'
  | 'toggleSidebar'
  | 'toggleTheme'

/**
 * 热键作用域
 */
export type HotkeyScope = 'global' | 'chat'

/**
 * 热键定义
 */
export interface HotkeyDefinition {
  /** 快捷键组合，使用 react-hotkeys-hook 格式 */
  keys: string
  /** 热键描述 */
  description: string
  /** 是否在表单元素中启用 */
  enableOnFormTags?: boolean
  /** 作用域 */
  scope?: HotkeyScope
}

/**
 * 热键配置表
 *
 * 集中管理所有热键定义，方便维护和自定义。
 * 键名使用 `mod` 表示跨平台修饰键（Mac: Cmd, Windows/Linux: Ctrl）
 */
export const HOTKEY_DEFINITIONS: Record<HotkeyId, HotkeyDefinition> = {
  newSession: {
    keys: 'mod+n',
    description: '创建新会话',
    scope: 'global',
  },
  search: {
    keys: 'mod+k',
    description: '打开搜索',
    scope: 'global',
  },
  export: {
    keys: 'mod+shift+s',
    description: '导出对话',
    scope: 'chat',
  },
  stopGeneration: {
    keys: 'escape',
    description: '停止 AI 生成',
    scope: 'chat',
  },
  sendMessage: {
    keys: 'mod+enter',
    description: '发送消息',
    enableOnFormTags: true,
    scope: 'chat',
  },
  toggleSidebar: {
    keys: 'mod+b',
    description: '切换侧边栏',
    scope: 'global',
  },
  toggleTheme: {
    keys: 'mod+shift+l',
    description: '切换暗色/亮色主题',
    scope: 'global',
  },
}

/**
 * 获取热键显示文本
 *
 * @param hotkeyId - 热键 ID
 * @returns 格式化的快捷键显示文本
 */
export const getHotkeyDisplayText = (hotkeyId: HotkeyId): string => {
  const def = HOTKEY_DEFINITIONS[hotkeyId]

  // 检测是否为 Mac 平台
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  return def.keys
    .replace('mod', isMac ? '⌘' : 'Ctrl')
    .replace('shift', isMac ? '⇧' : 'Shift')
    .replace('alt', isMac ? '⌥' : 'Alt')
    .replace('+', ' + ')
    .replace('escape', 'Esc')
}
