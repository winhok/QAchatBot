import { AnimatePresence, motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { LoadingIndicator } from '@/components/LoadingIndicator'
import { MessageBubble } from '@/components/MessageBubble'
import { StopGenerationButton } from '@/components/StopGenerationButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fadeInUp, staggerContainer } from '@/lib/motion'
import { useChatStore } from '@/stores/chat'
import { useSendMessage } from '@/stores/useSendMessage'

export function MessageList() {
  const messages = useChatStore((state) => state.messages)
  const isLoading = useChatStore((state) => state.isLoading)
  const { abortCurrent } = useSendMessage()

  if (messages.length === 0) {
    return <ScrollArea className="flex-1 px-4" />
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl space-y-8 py-6"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
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
  )
}
