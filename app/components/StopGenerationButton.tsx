'use client'

import { Square } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

interface StopGenerationButtonProps {
  onStop: () => void
  isGenerating: boolean
}

export function StopGenerationButton({ onStop, isGenerating }: StopGenerationButtonProps) {
  if (!isGenerating) return null

  return (
    <Button
      onClick={onStop}
      variant="outline"
      size="sm"
      className="gap-2 border-border/50 bg-card/80 hover:bg-card hover:border-red-500/50 transition-all"
    >
      <div className="relative">
        <Square className="h-3 w-3 fill-current" />
        <div className="absolute inset-0 animate-ping">
          <Square className="h-3 w-3 fill-current opacity-50" />
        </div>
      </div>
      <span>停止生成</span>
    </Button>
  )
}
