import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useStickToBottomContext } from 'use-stick-to-bottom'
import { Button } from '@/components/ui/button'

/**
 * Floating button that appears when user scrolls up from the bottom
 * Clicking it smoothly scrolls back to the latest message
 */
export function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()
  const shouldReduceMotion = useReducedMotion()

  if (isAtBottom) return null

  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
      }

  return (
    <motion.div {...motionProps} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => scrollToBottom()}
        className="border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] hover:shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
      >
        <ArrowDown className="h-4 w-4 mr-2" />
        滚动到底部
      </Button>
    </motion.div>
  )
}
