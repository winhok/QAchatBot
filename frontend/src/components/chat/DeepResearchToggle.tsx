import { Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DeepResearchToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
}

/**
 * Deep Research Mode Toggle
 *
 * When enabled, the agent will use a multi-tool workflow:
 * 1. analyze_research_topic - Analyze topic and create research plan
 * 2. research_section - Research each section
 * 3. generate_research_report - Compile final report
 */
export function DeepResearchToggle({
  enabled,
  onToggle,
  disabled = false,
}: DeepResearchToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggle(!enabled)}
            disabled={disabled}
            className={cn(
              'h-7 gap-1.5 px-2 border-2 border-foreground transition-all',
              enabled
                ? 'bg-primary text-primary-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]'
                : 'bg-background hover:bg-muted',
            )}
          >
            <Microscope className="h-4 w-4" />
            <span className="text-xs font-medium">深度研究</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">深度研究模式</p>
          <p className="text-xs text-muted-foreground mt-1">
            启用后，AI 将进行多阶段深度研究：分析主题、研究各章节、生成完整报告。
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
