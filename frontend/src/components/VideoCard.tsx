'use client'

import { Clock, Download, Loader2, Monitor, Video } from 'lucide-react'

interface VideoCardProps {
  status: 'loading' | 'ready'
  src?: string
  download?: string
  duration?: string
  resolution?: string
  prompt?: string
}

export function VideoCard({ status, src, download, duration, resolution, prompt }: VideoCardProps) {
  if (status === 'loading') {
    return (
      <div className="my-3 p-4 bg-muted/50 border border-border rounded-2xl w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">视频生成中...</h3>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse flex-shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-full">
              {prompt || '正在生成视频，请稍候（约 2-5 分钟）'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-3 bg-muted/50 border border-border rounded-2xl overflow-hidden w-full">
      <div className="relative">
        <video controls preload="metadata" className="w-full max-h-[400px] bg-black" src={src}>
          您的浏览器不支持视频播放
        </video>
      </div>

      <div className="p-3 flex items-center justify-between border-t border-border bg-muted/30">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Video className="w-4 h-4" />
            <span>视频</span>
          </div>
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{duration}s</span>
            </div>
          )}
          {resolution && (
            <div className="flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              <span>{resolution}</span>
            </div>
          )}
        </div>

        {download && (
          <a
            href={download}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>下载</span>
          </a>
        )}
      </div>
    </div>
  )
}

export function VideoCardSkeleton() {
  return (
    <div className="my-3 p-4 bg-muted/50 rounded-2xl border border-border w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  )
}
