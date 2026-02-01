import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useChatSearchParams } from '@/lib/searchParams'

/**
 * Toggle button to show/hide tool calls in the message list
 * Uses URL search params for state persistence
 */
export function HideToolCallsToggle() {
  const { hideToolCalls, toggleHideToolCalls } = useChatSearchParams()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleHideToolCalls}
            className="h-8 w-8"
            aria-label={hideToolCalls ? '显示工具调用' : '隐藏工具调用'}
          >
            {hideToolCalls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hideToolCalls ? '显示工具调用' : '隐藏工具调用'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
