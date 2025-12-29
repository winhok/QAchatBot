import type { Message, MessageContentBlock } from '@/schemas'

/**
 * 从消息内容中提取纯文本
 * 支持字符串或多模态内容块数组
 */
export function extractTextContent(content: Message['content']): string {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (block): block is Extract<MessageContentBlock, { type: 'text' }> =>
          block.type === 'text',
      )
      .map((block) => block.text)
      .join('\n')
  }
  return ''
}

/**
 * 从消息内容中提取图片 URL 列表
 */
export function extractImageUrls(content: Message['content']): Array<string> {
  if (typeof content === 'string') {
    return []
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (block): block is Extract<MessageContentBlock, { type: 'image_url' }> =>
          block.type === 'image_url',
      )
      .map((block) => block.image_url.url)
  }
  return []
}

/**
 * 从消息内容中提取媒体 URL 列表（视频/音频）
 */
export function extractMediaUrls(
  content: Message['content'],
): Array<{ url: string; mimeType: string }> {
  if (typeof content === 'string') {
    return []
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (block): block is Extract<MessageContentBlock, { type: 'media' }> =>
          block.type === 'media',
      )
      .map((block) => ({
        url: block.media.url,
        mimeType: block.media.mimeType,
      }))
  }
  return []
}

/**
 * 从消息内容中提取文档 URL 列表（PDF 等）
 */
export function extractDocumentUrls(
  content: Message['content'],
): Array<{ url: string; mimeType: string }> {
  if (typeof content === 'string') {
    return []
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (block): block is Extract<MessageContentBlock, { type: 'document' }> =>
          block.type === 'document',
      )
      .map((block) => ({
        url: block.document.url,
        mimeType: block.document.mimeType,
      }))
  }
  return []
}

/**
 * 检查消息是否包含多模态内容
 */
export function hasMultimodalContent(content: Message['content']): boolean {
  if (typeof content === 'string') {
    return false
  }
  return content.some((block) => block.type !== 'text')
}
