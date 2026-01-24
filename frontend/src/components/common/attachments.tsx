'use client'

import { FileTextIcon, ImageIcon, Music2Icon, PaperclipIcon, VideoIcon, XIcon } from 'lucide-react'
import { createContext, useContext, useMemo } from 'react'
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AttachmentMediaCategory = 'image' | 'video' | 'audio' | 'document' | 'unknown'

export type AttachmentVariant = 'grid' | 'inline' | 'list'

export interface AttachmentData {
  id: string
  url: string
  filename?: string
  mediaType?: string
}

export function getMediaCategory(mediaType?: string): AttachmentMediaCategory {
  if (!mediaType) return 'unknown'
  if (mediaType.startsWith('image/')) return 'image'
  if (mediaType.startsWith('video/')) return 'video'
  if (mediaType.startsWith('audio/')) return 'audio'
  if (mediaType.startsWith('application/') || mediaType.startsWith('text/')) return 'document'
  return 'unknown'
}

export function getAttachmentLabel(data: AttachmentData): string {
  const category = getMediaCategory(data.mediaType)
  return data.filename || (category === 'image' ? '图片' : '附件')
}

interface AttachmentsContextValue {
  variant: AttachmentVariant
}

const AttachmentsContext = createContext<AttachmentsContextValue | null>(null)

interface AttachmentContextValue {
  data: AttachmentData
  mediaCategory: AttachmentMediaCategory
  onRemove?: () => void
  variant: AttachmentVariant
}

const AttachmentContext = createContext<AttachmentContextValue | null>(null)

export function useAttachmentsContext(): AttachmentsContextValue {
  return useContext(AttachmentsContext) ?? { variant: 'grid' as const }
}

export function useAttachmentContext(): AttachmentContextValue {
  const ctx = useContext(AttachmentContext)
  if (!ctx) {
    throw new Error('Attachment components must be used within <Attachment>')
  }
  return ctx
}

export interface AttachmentsProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AttachmentVariant
}

export function Attachments({ variant = 'grid', className, children, ...props }: AttachmentsProps) {
  const contextValue = useMemo(() => ({ variant }), [variant])

  return (
    <AttachmentsContext.Provider value={contextValue}>
      <div
        className={cn(
          'flex items-start',
          variant === 'list' ? 'flex-col gap-2' : 'flex-wrap gap-2',
          variant === 'grid' && 'ml-auto w-fit',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AttachmentsContext.Provider>
  )
}

export interface AttachmentProps extends HTMLAttributes<HTMLDivElement> {
  data: AttachmentData
  onRemove?: () => void
}

export function Attachment({ data, onRemove, className, children, ...props }: AttachmentProps) {
  const { variant } = useAttachmentsContext()
  const mediaCategory = getMediaCategory(data.mediaType)

  const contextValue = useMemo<AttachmentContextValue>(
    () => ({ data, mediaCategory, onRemove, variant }),
    [data, mediaCategory, onRemove, variant],
  )

  return (
    <AttachmentContext.Provider value={contextValue}>
      <div
        className={cn(
          'group relative',
          variant === 'grid' && 'size-20 overflow-hidden rounded-lg border-2 border-foreground',
          variant === 'inline' && [
            'flex h-8 cursor-pointer select-none items-center gap-1.5',
            'rounded-md border border-border px-1.5',
            'font-medium text-sm transition-all',
            'hover:bg-accent hover:text-accent-foreground',
          ],
          variant === 'list' && [
            'flex w-full items-center gap-3 rounded-lg border p-3',
            'hover:bg-accent/50',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AttachmentContext.Provider>
  )
}

export interface AttachmentPreviewProps extends HTMLAttributes<HTMLDivElement> {
  fallbackIcon?: ReactNode
}

export function AttachmentPreview({ fallbackIcon, className, ...props }: AttachmentPreviewProps) {
  const { data, mediaCategory, variant } = useAttachmentContext()

  const iconSize = variant === 'inline' ? 'size-3' : 'size-4'

  const renderIcon = (Icon: typeof ImageIcon) => (
    <Icon className={cn(iconSize, 'text-muted-foreground')} />
  )

  const renderContent = () => {
    if (mediaCategory === 'image' && data.url) {
      return variant === 'grid' ? (
        <img alt={data.filename || '图片'} className="size-full object-cover" src={data.url} />
      ) : (
        <img
          alt={data.filename || '图片'}
          className="size-full rounded object-cover"
          height={20}
          src={data.url}
          width={20}
        />
      )
    }

    if (mediaCategory === 'video' && data.url) {
      return <video className="size-full object-cover" muted src={data.url} />
    }

    const iconMap: Record<AttachmentMediaCategory, typeof ImageIcon> = {
      image: ImageIcon,
      video: VideoIcon,
      audio: Music2Icon,
      document: FileTextIcon,
      unknown: PaperclipIcon,
    }

    const Icon = iconMap[mediaCategory]
    return fallbackIcon ?? renderIcon(Icon)
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden',
        variant === 'grid' && 'size-full bg-muted',
        variant === 'inline' && 'size-5 rounded bg-background',
        variant === 'list' && 'size-12 rounded bg-muted',
        className,
      )}
      {...props}
    >
      {renderContent()}
    </div>
  )
}

export interface AttachmentInfoProps extends HTMLAttributes<HTMLDivElement> {
  showMediaType?: boolean
}

export function AttachmentInfo({
  showMediaType = false,
  className,
  ...props
}: AttachmentInfoProps) {
  const { data, variant } = useAttachmentContext()
  const label = getAttachmentLabel(data)

  if (variant === 'grid') {
    return null
  }

  return (
    <div className={cn('min-w-0 flex-1', className)} {...props}>
      <span className="block truncate">{label}</span>
      {showMediaType && data.mediaType && (
        <span className="block truncate text-muted-foreground text-xs">{data.mediaType}</span>
      )}
    </div>
  )
}

export interface AttachmentRemoveProps extends ComponentProps<typeof Button> {
  label?: string
}

export function AttachmentRemove({
  label = '移除',
  className,
  children,
  ...props
}: AttachmentRemoveProps) {
  const { onRemove, variant } = useAttachmentContext()

  if (!onRemove) {
    return null
  }

  return (
    <Button
      aria-label={label}
      className={cn(
        variant === 'grid' && [
          'absolute top-1 right-1 size-5 rounded-full p-0',
          'bg-background/80 backdrop-blur-sm',
          'opacity-0 transition-opacity group-hover:opacity-100',
          'hover:bg-background',
          '[&>svg]:size-3',
        ],
        variant === 'inline' && [
          'size-5 rounded p-0',
          'opacity-0 transition-opacity group-hover:opacity-100',
          '[&>svg]:size-2.5',
        ],
        variant === 'list' && ['size-8 shrink-0 rounded p-0', '[&>svg]:size-4'],
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
      type="button"
      variant="ghost"
      size="icon"
      {...props}
    >
      {children ?? <XIcon />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
