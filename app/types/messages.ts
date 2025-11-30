export interface Message {
  id: string // 消息唯一标识
  content: string // 消息内容(支持 Markdown)
  role: 'user' | 'assistant' // 消息角色
  timestamp: Date // 消息时间戳
  isStreaming?: boolean // 是否正在流式传输(显示打字光标)
}
