import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface BranchSelectorProps {
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
}

/**
 * 分支选择器组件 - 用于在多个对话分支间切换
 * 基于 LangGraph 的 checkpoint 时间旅行机制
 */
export function BranchSelector({ currentIndex, total, onPrev, onNext }: BranchSelectorProps) {
  if (total <= 1) return null

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onPrev}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>上一个分支</p>
          </TooltipContent>
        </Tooltip>

        <span className="min-w-[2rem] text-center tabular-nums">
          {currentIndex + 1} / {total}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onNext}
              disabled={currentIndex >= total - 1}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>下一个分支</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
