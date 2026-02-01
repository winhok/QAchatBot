import { useStickToBottomContext } from 'use-stick-to-bottom'

export { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

/**
 * Custom hook that wraps useStickToBottomContext for easier use
 * Provides auto-scroll behavior during streaming with smart user scroll detection
 */
export function useStickToBottom() {
  const context = useStickToBottomContext()

  return {
    /** Ref to attach to the scrollable container */
    scrollRef: context.scrollRef,
    /** Ref to attach to the content container */
    contentRef: context.contentRef,
    /** Whether the view is currently at the bottom */
    isAtBottom: context.isAtBottom,
    /** Programmatically scroll to bottom */
    scrollToBottom: context.scrollToBottom,
  }
}
