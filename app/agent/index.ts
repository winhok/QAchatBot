export function formatMessagesForAgent(messages: { role: string; content: string }[]) {
  return messages.map(msg => {
    if (msg.role === 'user') {
      return { content: msg.content, type: 'human' }
    } else if (msg.role === 'assistant') {
      return { content: msg.content, type: 'ai' }
    }
    return msg
  })
}
