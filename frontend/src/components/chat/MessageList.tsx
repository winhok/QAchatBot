import { AnimatePresence, motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useState } from 'react'
import { EditMessageDialog } from '@/components/message/EditMessageDialog'
import { LoadingIndicator } from '@/components/common/LoadingIndicator'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { RegenerateDialog } from '@/components/message/RegenerateDialog'
import { StopGenerationButton } from '@/components/chat/StopGenerationButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fadeInUp, staggerContainer } from '@/lib/motion'
import { useChatStore } from '@/stores/chat'
import { useSendMessage } from '@/stores/useSendMessage'
import { extractTextContent } from '@/utils/message'

export function MessageList() {
  const messages = useChatStore((state) => state.messages)
  const isLoading = useChatStore((state) => state.isLoading)
  const { sendMessage, abortCurrent } = useSendMessage()

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const editingMessage = messages.find((m) => m.id === editingMessageId)

  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const regeneratingMessage = messages.find((m) => m.id === regeneratingMessageId)

  const handleEdit = (messageId: string) => {
    setEditingMessageId(messageId)
  }

  const handleEditSubmit = (content: string, messageId: string) => {
    setEditingMessageId(null)

    const msg = messages.find((m) => m.id === messageId)
    const targetCheckpointId = msg?.parentCheckpointId

    if (targetCheckpointId) {
      console.log(
        '[MessageList] Editing message, forking from parent checkpoint:',
        targetCheckpointId,
      )
      sendMessage(content, undefined, undefined, { checkpointId: targetCheckpointId })
    } else {
      console.warn('[MessageList] No parentCheckpointId available for message:', messageId)
      sendMessage(content)
    }
  }

  const handleRegenerate = (messageId: string) => {
    setRegeneratingMessageId(messageId)
  }

  const handleRegenerateConfirm = (messageId: string) => {
    setRegeneratingMessageId(null)

    const aiMsgIndex = messages.findIndex((m) => m.id === messageId)
    if (aiMsgIndex < 0) {
      console.warn('[MessageList] AI message not found:', messageId)
      return
    }

    const aiMsg = messages[aiMsgIndex]
    const userMsg = aiMsgIndex > 0 ? messages[aiMsgIndex - 1] : undefined

    if (!userMsg || userMsg.role !== 'user') {
      console.warn('[MessageList] Cannot find user message before AI message:', messageId)
      return
    }

    const targetCheckpointId = aiMsg.parentCheckpointId
    if (!targetCheckpointId) {
      console.warn('[MessageList] No parentCheckpointId available for AI message:', messageId)
      return
    }

    console.log('[MessageList] Regenerating AI, forking from checkpoint:', targetCheckpointId)
    const userContent = extractTextContent(userMsg.content)
    sendMessage(userContent, undefined, undefined, { checkpointId: targetCheckpointId })
  }

  if (messages.length === 0) {
    return <ScrollArea className="flex-1 px-4" />
  }

  return (
    <>
      <ScrollArea className="flex-1 px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl space-y-8 py-6"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
              />
            ))}

            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <motion.div
                key="loading-indicator"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex gap-3"
              >
                <Avatar className="h-8 w-8 shrink-0 bg-linear-to-br from-emerald-500 to-teal-600">
                  <AvatarFallback className="bg-transparent">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <LoadingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-2"
            >
              <StopGenerationButton onStop={abortCurrent} isGenerating={isLoading} />
            </motion.div>
          )}

          <div ref={(node) => node?.scrollIntoView({ behavior: 'smooth' })} />
        </motion.div>
      </ScrollArea>

      {/* 编辑消息对话框 */}
      <EditMessageDialog
        open={!!editingMessageId}
        onOpenChange={(open) => !open && setEditingMessageId(null)}
        message={editingMessage}
        onSubmit={handleEditSubmit}
      />

      {/* 重新生成对话框 */}
      <RegenerateDialog
        open={!!regeneratingMessageId}
        onOpenChange={(open) => !open && setRegeneratingMessageId(null)}
        message={regeneratingMessage}
        onConfirm={handleRegenerateConfirm}
      />
    </>
  )
}
