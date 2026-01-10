import { ChevronRight, FileCode, Loader2 } from 'lucide-react'
import type { CanvasArtifact } from '@/types/canvas'

interface CanvasTitleCardProps {
  artifact: CanvasArtifact
  onOpen: (artifactId: string) => void
}

export function CanvasTitleCard({ artifact, onOpen }: CanvasTitleCardProps) {
  const handleClick = () => {
    onOpen(artifact.id)
  }

  return (
    <div
      className="canvas-title-card my-3 p-4 bg-muted/30 border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 transition-all duration-200 group w-full"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        {/* 图标 */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
          <FileCode className="w-5 h-5" />
        </div>

        {/* 标题和版本 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{artifact.title}</h3>
            {artifact.currentVersion > 1 && (
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                v{artifact.currentVersion}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            React Component · {artifact.code.language}
          </p>
        </div>

        {/* 状态指示和操作按钮 */}
        <div className="flex items-center gap-2">
          {artifact.isStreaming ? (
            <div className="flex items-center gap-1.5 text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Generating</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
              View <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
