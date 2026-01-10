/**
 * Canvas Artifact 流式解析器
 *
 * 解析 AI 输出中的 <canvasArtifact> 和 <canvasCode> 标签
 * 支持流式解析，每次调用 parse() 传入增量内容
 */

export interface CanvasArtifactMetadata {
  id: string
  type: string
  title: string
  messageId: string
}

export interface CanvasArtifactCallbacks {
  onArtifactStart: (metadata: CanvasArtifactMetadata) => void
  onCodeStart: (messageId: string, artifactId: string, language: string) => void
  onCodeChunk: (messageId: string, artifactId: string, chunk: string) => void
  onCodeEnd: (messageId: string, artifactId: string, fullContent: string) => void
  onArtifactEnd: (messageId: string, artifactId: string) => void
  onError?: (error: Error) => void
}

type ParserState = 'idle' | 'in_artifact' | 'in_code'

export class CanvasArtifactParser {
  private buffer = ''
  private state: ParserState = 'idle'
  private currentArtifact: CanvasArtifactMetadata | null = null
  private currentLanguage = 'jsx'
  private codeContent = ''
  private callbacks: CanvasArtifactCallbacks

  constructor(callbacks: CanvasArtifactCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * 解析增量内容
   * @param messageId 当前消息 ID
   * @param chunk 增量文本
   */
  parse(messageId: string, chunk: string): void {
    this.buffer += chunk

    // 状态机处理
    while (this.processBuffer(messageId)) {
      // 继续处理直到无法继续
    }
  }

  private processBuffer(messageId: string): boolean {
    switch (this.state) {
      case 'idle':
        return this.processIdle(messageId)
      case 'in_artifact':
        return this.processInArtifact(messageId)
      case 'in_code':
        return this.processInCode(messageId)
      default:
        return false
    }
  }

  private processIdle(messageId: string): boolean {
    // 查找 <canvasArtifact 开始标签
    const artifactStartMatch = this.buffer.match(
      /<canvasArtifact[^>]*id=["']([^"']+)["'][^>]*type=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>/,
    )

    if (!artifactStartMatch) {
      // 尝试另一种属性顺序
      const altMatch = this.buffer.match(
        /<canvasArtifact[^>]*id=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*type=["']([^"']+)["'][^>]*>/,
      )
      if (altMatch) {
        const [fullMatch, id, title, type] = altMatch
        this.currentArtifact = { id, type, title, messageId }
        this.state = 'in_artifact'
        this.buffer = this.buffer.slice(this.buffer.indexOf(fullMatch) + fullMatch.length)
        this.callbacks.onArtifactStart(this.currentArtifact)
        return true
      }

      // 清理已确定不包含开始标签的部分（保留可能的部分标签）
      const potentialStart = this.buffer.lastIndexOf('<canvas')
      if (potentialStart > 0) {
        this.buffer = this.buffer.slice(potentialStart)
      } else if (this.buffer.length > 500 && !this.buffer.includes('<')) {
        this.buffer = ''
      }
      return false
    }

    const [fullMatch, id, type, title] = artifactStartMatch
    this.currentArtifact = { id, type, title, messageId }
    this.state = 'in_artifact'
    this.buffer = this.buffer.slice(this.buffer.indexOf(fullMatch) + fullMatch.length)
    this.callbacks.onArtifactStart(this.currentArtifact)
    return true
  }

  private processInArtifact(messageId: string): boolean {
    if (!this.currentArtifact) return false

    // 查找 <canvasCode 开始标签
    const codeStartMatch = this.buffer.match(/<canvasCode[^>]*language=["']?(\w+)["']?[^>]*>/)

    if (codeStartMatch) {
      const [fullMatch, language] = codeStartMatch
      this.currentLanguage = language || 'jsx'
      this.codeContent = ''
      this.state = 'in_code'
      this.buffer = this.buffer.slice(this.buffer.indexOf(fullMatch) + fullMatch.length)
      this.callbacks.onCodeStart(messageId, this.currentArtifact.id, this.currentLanguage)
      return true
    }

    // 查找 </canvasArtifact> 结束标签（没有代码的情况）
    const artifactEndIndex = this.buffer.indexOf('</canvasArtifact>')
    if (artifactEndIndex !== -1) {
      this.state = 'idle'
      this.buffer = this.buffer.slice(artifactEndIndex + '</canvasArtifact>'.length)
      this.callbacks.onArtifactEnd(messageId, this.currentArtifact.id)
      this.currentArtifact = null
      return true
    }

    return false
  }

  private processInCode(messageId: string): boolean {
    if (!this.currentArtifact) return false

    // 查找 </canvasCode> 结束标签
    const codeEndIndex = this.buffer.indexOf('</canvasCode>')

    if (codeEndIndex !== -1) {
      // 代码结束
      const newCodeChunk = this.buffer.slice(0, codeEndIndex)
      this.codeContent += newCodeChunk
      this.callbacks.onCodeChunk(messageId, this.currentArtifact.id, newCodeChunk)
      this.callbacks.onCodeEnd(messageId, this.currentArtifact.id, this.codeContent.trim())

      this.buffer = this.buffer.slice(codeEndIndex + '</canvasCode>'.length)
      this.state = 'in_artifact'
      return true
    }

    // 代码还在流式输出中，发送已有内容作为 chunk
    // 保留最后 50 个字符以防止标签被截断
    if (this.buffer.length > 50) {
      const safeLength = this.buffer.length - 50
      const chunk = this.buffer.slice(0, safeLength)
      this.codeContent += chunk
      this.callbacks.onCodeChunk(messageId, this.currentArtifact.id, chunk)
      this.buffer = this.buffer.slice(safeLength)
    }

    return false
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.buffer = ''
    this.state = 'idle'
    this.currentArtifact = null
    this.currentLanguage = 'jsx'
    this.codeContent = ''
  }
}
