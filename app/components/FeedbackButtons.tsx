'use client'

// TODO: 反馈按钮组件（点赞/点踩）
// 功能需求：
// 1. 点赞/点踩按钮
// 2. 点击后发送反馈到后端
// 3. 已反馈状态的视觉区分
// 4. 可选：点踩时弹出反馈原因选择
// 5. 参考 ChatGPT/Claude 的反馈机制

import { useState } from 'react'

interface FeedbackButtonsProps {
  messageId: string
  onFeedback: (messageId: string, type: 'positive' | 'negative', reason?: string) => void
}

export function FeedbackButtons({ messageId, onFeedback }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleFeedback = (type: 'positive' | 'negative') => {
    // TODO: 实现反馈逻辑
    // - 更新本地状态
    // - 调用 onFeedback 回调
    // - 如果是 negative，可选弹出原因选择
  }

  return (
    <div className="flex items-center gap-1">
      {/* TODO: 点赞按钮 (ThumbsUp) */}
      {/* TODO: 点踩按钮 (ThumbsDown) */}
    </div>
  )
}
