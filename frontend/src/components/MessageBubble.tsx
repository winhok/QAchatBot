import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import type { Message } from '@/schemas'
import { ApiResultBlock } from '@/components/ApiResultBlock'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { MessageActions } from '@/components/MessageActions'
import { ToolCallBlock } from '@/components/ToolCallBlock'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { assistantMessageVariants, typingCursorVariants, userMessageVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  extractDocumentUrls,
  extractImageUrls,
  extractMediaUrls,
  extractTextContent,
} from '@/utils/message'

interface MessageBubbleProps {
  message: Message
  onEdit?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
}

export function MessageBubble({ message, onEdit, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const textContent = extractTextContent(message.content)
  const imageUrls = extractImageUrls(message.content)
  const mediaUrls = extractMediaUrls(message.content)
  const documentUrls = extractDocumentUrls(message.content)
  const hasContent =
    textContent || imageUrls.length > 0 || mediaUrls.length > 0 || documentUrls.length > 0

  const messageVariants = isUser ? userMessageVariants : assistantMessageVariants

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn('group flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <Avatar
        className={cn(
          'h-8 w-8 shrink-0',
          !isUser ? 'bg-linear-to-br from-emerald-500 to-teal-600' : 'bg-muted',
        )}
      >
        <AvatarFallback className="bg-transparent">
          {isUser ? (
            <User className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className={cn('max-w-[85%] space-y-3', isUser && 'flex flex-col items-end')}>
        {hasContent && (
          <div className="relative">
            <div
              className={cn(
                'rounded-2xl px-4 py-3',
                isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
              )}
            >
              {/* 渲染图片 */}
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Image ${idx + 1}`}
                      className="max-w-xs max-h-64 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 渲染视频/音频 */}
              {mediaUrls.length > 0 && (
                <div className="space-y-2 mb-3">
                  {mediaUrls.map((media, idx) =>
                    media.mimeType.startsWith('video/') ? (
                      <video key={idx} controls className="max-w-md rounded-lg">
                        <source src={media.url} type={media.mimeType} />
                      </video>
                    ) : media.mimeType.startsWith('audio/') ? (
                      <audio key={idx} controls className="w-full max-w-md">
                        <source src={media.url} type={media.mimeType} />
                      </audio>
                    ) : null,
                  )}
                </div>
              )}

              {/* 渲染文档链接 */}
              {documentUrls.length > 0 && (
                <div className="space-y-1 mb-3">
                  {documentUrls.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                    >
                      📄 {doc.mimeType === 'application/pdf' ? 'PDF 文档' : '文档'} {idx + 1}
                    </a>
                  ))}
                </div>
              )}

              {textContent && (
                <div className="text-sm leading-relaxed">
                  <MarkdownRenderer content={textContent} />
                </div>
              )}
              {message.isStreaming && (
                <motion.span
                  variants={typingCursorVariants}
                  animate="animate"
                  className="inline-block w-2 h-4 bg-current ml-1"
                />
              )}
            </div>
            {/* 消息操作按钮 */}
            {!message.isStreaming && (
              <div className={cn('absolute -bottom-6', isUser ? 'right-0' : 'left-0')}>
                <MessageActions message={message} onEdit={onEdit} onRegenerate={onRegenerate} />
              </div>
            )}
          </div>
        )}

        {message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 w-full">
            {message.toolCalls.map((tool) => (
              <ToolCallBlock key={tool.id} data={tool} />
            ))}
          </div>
        )}

        {message.role === 'assistant' && message.apiResult && (
          <ApiResultBlock data={message.apiResult} />
        )}
      </div>
    </motion.div>
  )
}
