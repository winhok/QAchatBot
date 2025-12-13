'use client'

export function LoadingIndicator() {
  return (
    <div className='flex items-center gap-2 rounded-2xl bg-muted px-4 py-3'>
      <div className='flex space-x-1'>
        <div className='w-2 h-2 bg-emerald-400 rounded-full animate-bounce'></div>
        <div className='w-2 h-2 bg-emerald-400 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
        <div className='w-2 h-2 bg-emerald-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className='text-sm text-muted-foreground'>正在思考...</span>
    </div>
  )
}
