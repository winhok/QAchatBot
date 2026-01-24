/**
 * 工具函数
 */

/**
 * 移除 JSON 代码块标记
 */
export function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

/**
 * 将消息内容转换为字符串
 */
export function messageContentToString(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .map((item: unknown) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null && 'text' in item) {
          return String((item as { text: unknown }).text)
        }
        return ''
      })
      .join('')
  }
  return String(content)
}
