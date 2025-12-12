'use client'

import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { cn } from '@/app/lib/utils'
import { Sparkles, Zap } from 'lucide-react'

export function ChatHeader() {
  return (
    <header className='relative z-10 backdrop-blur-lg bg-slate-950/40 border-b border-white/10 p-4 shrink-0 w-full'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {/* Avatar with glassmorphic style */}
            <div className='relative'>
              <Avatar className='w-10 h-10 rounded-xl shadow-lg shadow-purple-500/20'>
                <AvatarFallback className='bg-linear-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-xl'>
                  <Sparkles className='h-5 w-5 text-white' />
                </AvatarFallback>
              </Avatar>
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 ring-1 ring-emerald-400/50'></div>
            </div>

            {/* Neon gradient title */}
            <div>
              <h1 className='text-xl font-bold flex items-center gap-2'>
                <span className='bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent'>LangGraph AI 助手</span>
                <Zap className='h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' />
              </h1>
              <p className='text-purple-300/70 text-xs'>智能对话 • 实时响应 • 无限可能</p>
            </div>
          </div>

          {/* Status badges with glassmorphism */}
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className={cn(
                'backdrop-blur-md bg-linear-to-r from-purple-500/10 to-cyan-500/10',
                'border-white/10 text-white text-xs px-2.5 py-1',
                'shadow-lg shadow-purple-500/10'
              )}
            >
              <div className='w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1.5 shadow-[0_0_6px_rgba(52,211,153,0.6)]'></div>
              qwen-plus
            </Badge>
            <Badge
              variant='outline'
              className={cn(
                'backdrop-blur-md bg-linear-to-r from-cyan-500/10 to-teal-500/10',
                'border-white/10 text-white text-xs px-2.5 py-1',
                'shadow-lg shadow-cyan-500/10'
              )}
            >
              🚀 StateGraph
            </Badge>
            <Badge
              variant='outline'
              className={cn(
                'backdrop-blur-md bg-linear-to-r from-pink-500/10 to-orange-500/10',
                'border-white/10 text-white text-xs px-2.5 py-1',
                'shadow-lg shadow-pink-500/10'
              )}
            >
              ⚡ 流式
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
