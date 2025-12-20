'use client'

// TODO: 主题切换组件
// 功能需求：
// 1. 支持 亮色/暗色/跟随系统 三种模式
// 2. 使用 next-themes 库
// 3. 切换时平滑过渡动画
// 4. 持久化用户选择到 localStorage
// 5. 参考 Claude 的主题切换设计

import { useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  // TODO: 实现主题切换
  // - 使用 next-themes 的 useTheme hook
  // - 或自己实现主题切换逻辑
  // - 图标随主题变化（Sun/Moon/Monitor）

  return (
    <button>
      {/* TODO: 实现 UI */}
    </button>
  )
}
