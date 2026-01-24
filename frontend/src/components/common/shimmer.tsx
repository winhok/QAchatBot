import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ShimmerProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  duration?: number
}

export function Shimmer({ children, duration = 1.5, className, style, ...props }: ShimmerProps) {
  return (
    <span
      className={cn(
        'inline-block bg-gradient-to-r from-current via-current/50 to-current bg-clip-text',
        'animate-shimmer bg-[length:200%_100%]',
        className,
      )}
      style={{
        animationDuration: `${duration}s`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
