import React, { startTransition, useActionState, useRef } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  width?: number
  onWidthChange?: (width: number) => void
  resizeDirection?: 'right' | 'left'
  className?: string
  showResizeHandle?: boolean
}

export function ResizablePanel({
  children,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 800,
  width: controlledWidth,
  onWidthChange,
  resizeDirection = 'right',
  className = '',
  showResizeHandle = true,
}: ResizablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ startX: 0, startWidth: 0 })

  const [resizeState, dispatch] = useActionState(
    (
      prev: { width: number; isResizing: boolean },
      action:
        | { type: 'start'; x: number }
        | { type: 'move'; x: number }
        | { type: 'end' },
    ) => {
      switch (action.type) {
        case 'start':
          dragState.current = { startX: action.x, startWidth: prev.width }
          return { ...prev, isResizing: true }

        case 'move': {
          if (!prev.isResizing) return prev
          const deltaX =
            resizeDirection === 'right'
              ? action.x - dragState.current.startX
              : dragState.current.startX - action.x
          const newWidth = Math.max(
            minWidth,
            Math.min(maxWidth, dragState.current.startWidth + deltaX),
          )
          if (controlledWidth === undefined) {
            onWidthChange?.(newWidth)
            return { ...prev, width: newWidth }
          }
          onWidthChange?.(newWidth)
          return prev
        }

        case 'end':
          return { ...prev, isResizing: false }

        default:
          return prev
      }
    },
    { width: controlledWidth ?? defaultWidth, isResizing: false },
  )

  const width = controlledWidth ?? resizeState.width
  const isResizing = resizeState.isResizing

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    startTransition(() => {
      dispatch({ type: 'start', x: e.clientX })
    })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return
    startTransition(() => {
      dispatch({ type: 'move', x: e.clientX })
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    startTransition(() => {
      dispatch({ type: 'end' })
    })
  }

  // Suppress unused ref warning
  void panelRef

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}

      {showResizeHandle && (
        <div
          className={`
            absolute top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500/50
            transition-colors cursor-col-resize z-10 group touch-none
            ${resizeDirection === 'right' ? 'right-0' : 'left-0'}
            ${isResizing ? 'bg-blue-500/50' : ''}
          `}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="拖拽调整大小"
        >
          <div
            className={`
            absolute top-1/2 transform -translate-y-1/2
            w-1 h-8 bg-gray-300/50 rounded-full
            group-hover:bg-blue-400/70
            transition-colors
            ${resizeDirection === 'right' ? '-left-0.5' : '-right-0.5'}
            ${isResizing ? 'bg-blue-400/70' : ''}
          `}
          />
        </div>
      )}
    </div>
  )
}
