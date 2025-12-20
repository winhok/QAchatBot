'use client'

// TODO: 滚动到底部按钮组件
// 功能需求：
// 1. 当用户向上滚动时显示
// 2. 点击后平滑滚动到底部
// 3. 显示未读消息数量（可选）
// 4. 流式输出时自动滚动的智能控制
// 5. 参考 ChatGPT/Claude 的滚动行为

interface ScrollToBottomProps {
  onClick: () => void
  show: boolean
  unreadCount?: number
}

export function ScrollToBottom({ onClick, show, unreadCount }: ScrollToBottomProps) {
  // TODO: 实现滚动到底部按钮
  // - 固定定位在消息列表底部
  // - 带有向下箭头图标
  // - 可选显示未读数量 badge
  // - 进入/离开动画

  if (!show) return null

  return (
    <button onClick={onClick}>
      {/* TODO: 实现 UI */}
    </button>
  )
}
