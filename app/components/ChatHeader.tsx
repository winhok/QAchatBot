'use client'

import { Sparkles, Zap } from 'lucide-react'

export function ChatHeader() {
  return (
    <header className='relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20 p-4 shrink-0 w-full'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <div className='w-10 h-10 bg-linear-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg'>
                <Sparkles className='h-5 w-5 text-white' />
              </div>
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white'></div>
            </div>
            <div>
              <h1 className='text-xl font-bold text-white flex items-center gap-2'>
                LangGraph AI 助手
                <Zap className='h-4 w-4 text-yellow-400' />
              </h1>
              <p className='text-purple-200 text-xs'>智能对话 • 实时响应 • 无限可能</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <div className='px-2 py-1 bg-linear-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs flex items-center gap-1'>
              <div className='w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse'></div>
              qwen-plus
            </div>
            <div className='px-2 py-1 bg-linear-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs'>
              🚀 StateGraph
            </div>
            <div className='px-2 py-1 bg-linear-to-r from-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs'>
              ⚡ 流式
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
