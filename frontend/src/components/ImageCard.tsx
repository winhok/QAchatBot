'use client'

import { Download, Image as ImageIcon, Loader2, Maximize2, Monitor } from 'lucide-react'
import { useState } from 'react'

interface ImageCardProps {
  status: 'loading' | 'ready'
  src?: string
  download?: string
  alt?: string
  prompt?: string
  aspectRatio?: string
}

export function ImageCard({ status, src, download, alt, prompt, aspectRatio }: ImageCardProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  if (status === 'loading') {
    return (
      <div className="my-3 p-4 bg-muted/50 border border-border rounded-2xl w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">图片生成中...</h3>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-full">
              {prompt || '正在绘制画面，请稍候...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-3 bg-muted/50 border border-border rounded-2xl overflow-hidden w-full group">
      <div className="relative overflow-hidden bg-black/20">
        <img
          src={src}
          alt={alt || prompt || 'Generated image'}
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02] cursor-pointer"
          loading="lazy"
          onClick={() => setIsZoomed(true)}
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

        <button
          onClick={() => setIsZoomed(true)}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          title="查看大图"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 flex items-center justify-between border-t border-border bg-muted/30">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" />
            <span>AI 绘图</span>
          </div>
          {aspectRatio && (
            <div className="flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              <span>{aspectRatio}</span>
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

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={src}
              alt={alt || prompt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="mt-2 text-center text-muted-foreground text-sm max-w-2xl mx-auto truncate">
              {prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
