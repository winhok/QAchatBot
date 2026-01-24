import { useState } from 'react'

// TODO: 消息编辑对话框组件
// 功能需求：
// 1. 编辑用户已发送的消息
// 2. 编辑后可选择：覆盖原消息 或 创建分支
// 3. 保留原消息的编辑历史
// 4. 参考 ChatGPT 的消息编辑功能

interface MessageEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: string
  originalContent: string
  onSave: (newContent: string, createBranch: boolean) => void
}

export function MessageEditDialog({
  open,
  onOpenChange,
  messageId,
  originalContent,
  onSave,
}: MessageEditDialogProps) {
  const [content, setContent] = useState(originalContent)
  const [createBranch, setCreateBranch] = useState(false)

  const handleSave = () => {
    // TODO: 实现保存逻辑
    // - 调用 onSave 回调
    // - 关闭对话框
    onSave(content, createBranch)
    onOpenChange(false)
  }

  // Suppress unused variable warnings for TODO implementations
  void messageId
  void handleSave
  void setContent
  void setCreateBranch
  void open

  return (
    <div>
      {/* TODO: 使用 Dialog 组件 */}
      {/* TODO: Textarea 编辑区域 */}
      {/* TODO: 分支选项（Checkbox 或 RadioGroup） */}
      {/* TODO: 保存/取消按钮 */}
    </div>
  )
}
