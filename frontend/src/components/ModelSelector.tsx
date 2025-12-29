import { useState } from 'react'
import { Check, ChevronDown, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { models } from '@/config/models'

interface ModelSelectorProps {
  currentModelId: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
}

export function ModelSelector({
  currentModelId,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentModel = models.find((m) => m.id === currentModelId)

  const handleSelect = (modelId: string) => {
    onModelChange(modelId)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate">
            {currentModel?.name || '选择模型'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSelect(model.id)}
            className="flex items-start gap-2 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{model.name}</span>
                {model.id === currentModelId && (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {model.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
