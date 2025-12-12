'use client'

import { Sparkles, Zap } from 'lucide-react'

export function ChatHeader() {
  return (
    <header className='relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20 p-4 shrink-0 w-full shadow-lg'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <div className='w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-purple-300/30'>
                <Sparkles className='h-5 w-5 text-white' />
              </div>
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 shadow-sm' aria-label='在线状态'></div>
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
            <div className='px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow duration-200'>
              <div className='w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50'></div>
              <span className='font-medium'>qwen-plus</span>
            </div>
            <div className='px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs shadow-sm hover:shadow-md transition-shadow duration-200'>
              <span className='font-medium'>🚀 StateGraph</span>
            </div>
            <div className='px-3 py-1.5 bg-gradient-to-r from-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs shadow-sm hover:shadow-md transition-shadow duration-200'>
              <span className='font-medium'>⚡ 流式</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
