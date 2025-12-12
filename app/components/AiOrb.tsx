'use client'

import { useEffect, useRef } from 'react'

interface AiOrbProps {
  size?: number
  isThinking?: boolean
  className?: string
}

export function AiOrb({ size = 80, isThinking = false, className = '' }: AiOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const animate = () => {
      time += 0.02

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const baseRadius = size / 3

      // Draw multiple layers for depth
      for (let i = 0; i < 3; i++) {
        const radius = baseRadius + i * 5 + Math.sin(time + i) * (isThinking ? 8 : 3)
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)

        if (i === 0) {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)')
          gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)')
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0)')
        } else if (i === 1) {
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.6)')
          gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)')
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)')
        } else {
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.4)')
          gradient.addColorStop(0.5, 'rgba(219, 39, 119, 0.2)')
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0)')
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.6)
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      coreGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)')
      coreGradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)')

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2)
      ctx.fill()

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [size, isThinking])

  return (
    <div className={`relative inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className='drop-shadow-2xl'
        style={{ filter: 'blur(0.5px)' }}
      />
      {isThinking && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-2 h-2 bg-white rounded-full animate-ping' />
        </div>
      )}
    </div>
  )
}
