'use client'

import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface FloatingChatBubbleProps {
  onToggle?: (isOpen: boolean) => void
  defaultPosition?: { x: number; y: number }
}

export function FloatingChatBubble({ onToggle, defaultPosition = { x: 20, y: 20 } }: FloatingChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDocked, setIsDocked] = useState(true)
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDocked) return
    setIsDragging(true)
    const rect = bubbleRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDocked) return
    const touch = e.touches[0]
    setIsDragging(true)
    const rect = bubbleRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isDocked) return
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 64, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 64, newY)),
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isDocked) return
      const touch = e.touches[0]
      const newX = touch.clientX - dragOffset.x
      const newY = touch.clientY - dragOffset.y
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 64, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 64, newY)),
      })
      e.preventDefault()
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, dragOffset, isDocked])

  const toggleDock = () => {
    setIsDocked(!isDocked)
  }

  return (
    <>
      {/* Floating Bubble */}
      <div
        ref={bubbleRef}
        className={`fixed z-50 transition-all duration-300 ${isDocked ? 'bottom-6 right-6' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={
          isDocked
            ? {}
            : {
                left: `${position.x}px`,
                top: `${position.y}px`,
              }
        }
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className='relative group'>
          {/* Main Bubble Button */}
          <button
            onClick={handleToggle}
            className='w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95 ring-4 ring-purple-400/30'
            aria-label='打开聊天'
          >
            {isOpen ? <X className='h-8 w-8 text-white' /> : <MessageCircle className='h-8 w-8 text-white' />}
          </button>

          {/* Dock/Undock Button */}
          <button
            onClick={toggleDock}
            className='absolute -top-2 -right-2 w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center hover:bg-white/20'
            aria-label={isDocked ? '解除固定' : '固定位置'}
          >
            {isDocked ? <Maximize2 className='h-4 w-4 text-white' /> : <Minimize2 className='h-4 w-4 text-white' />}
          </button>

          {/* Status Indicator */}
          <div className='absolute -top-1 -left-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse' />
        </div>
      </div>

      {/* Chat Panel (when open) */}
      {isOpen && (
        <div className='fixed bottom-28 right-6 w-96 h-[600px] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden'>
          <div className='p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-cyan-500/20'>
            <h3 className='text-white font-bold text-lg'>AI 助手</h3>
            <p className='text-purple-200 text-xs'>随时为您服务</p>
          </div>
          <div className='flex-1 p-4 overflow-y-auto custom-scrollbar'>
            <div className='text-purple-200 text-sm text-center'>聊天面板内容区域</div>
          </div>
          <div className='p-4 border-t border-white/10'>
            <input
              type='text'
              placeholder='输入消息...'
              className='w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
            />
          </div>
        </div>
      )}
    </>
  )
}
