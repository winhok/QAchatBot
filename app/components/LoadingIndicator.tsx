'use client'

import { Bot } from 'lucide-react'

export function LoadingIndicator() {
  return (
    <div className='flex gap-4 opacity-0' style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
      <div className='shrink-0'>
        <div className='w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
          <Bot className='h-5 w-5 text-white' />
        </div>
      </div>
      <div className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl rounded-bl-md p-4 shadow-lg'>
        <div className='flex items-center gap-2'>
          <div className='flex space-x-1'>
            <div className='w-2 h-2 bg-purple-400 rounded-full animate-bounce'></div>
            <div className='w-2 h-2 bg-cyan-400 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
            <div className='w-2 h-2 bg-pink-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className='text-purple-200 text-xs ml-2'>AI 正在思考...</span>
        </div>
      </div>
    </div>
  )
}
