'use client'

export function AIOrb() {
  return (
    <div className='relative flex items-center justify-center'>
      {/* Outer glow rings */}
      <div className='absolute h-40 w-40 animate-pulse rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-2xl' />
      <div
        className='absolute h-32 w-32 animate-pulse rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl'
        style={{ animationDelay: '0.5s' }}
      />

      {/* Rotating outer ring */}
      <svg className='absolute h-36 w-36 animate-spin' style={{ animationDuration: '8s' }}>
        <defs>
          <linearGradient id='ring-gradient-1' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#10b981' stopOpacity='0' />
            <stop offset='50%' stopColor='#10b981' stopOpacity='0.6' />
            <stop offset='100%' stopColor='#14b8a6' stopOpacity='0' />
          </linearGradient>
        </defs>
        <circle
          cx='72'
          cy='72'
          r='66'
          fill='none'
          stroke='url(#ring-gradient-1)'
          strokeWidth='1'
          strokeDasharray='100 300'
          strokeLinecap='round'
        />
      </svg>

      {/* Rotating middle ring */}
      <svg
        className='absolute h-28 w-28 animate-spin'
        style={{ animationDuration: '4s', animationDirection: 'reverse' }}
      >
        <defs>
          <linearGradient id='ring-gradient-2' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#06b6d4' stopOpacity='0' />
            <stop offset='50%' stopColor='#06b6d4' stopOpacity='0.8' />
            <stop offset='100%' stopColor='#10b981' stopOpacity='0' />
          </linearGradient>
        </defs>
        <circle
          cx='56'
          cy='56'
          r='50'
          fill='none'
          stroke='url(#ring-gradient-2)'
          strokeWidth='2'
          strokeDasharray='80 240'
          strokeLinecap='round'
        />
      </svg>

      {/* Inner core */}
      <div className='relative'>
        {/* Core glow */}
        <div className='absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 blur-md opacity-60' />

        {/* Core sphere */}
        <div className='relative h-16 w-16 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10'>
          {/* Inner gradient */}
          <div className='absolute inset-1 rounded-full bg-gradient-to-br from-slate-700 to-slate-900' />

          {/* Highlight */}
          <div className='absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-sm' />
          <div className='absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-white/60' />

          {/* Center dot */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50' />
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div
        className='absolute h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-bounce'
        style={{ top: '10%', left: '20%', animationDuration: '2s' }}
      />
      <div
        className='absolute h-1 w-1 rounded-full bg-teal-400/60 animate-bounce'
        style={{ bottom: '20%', right: '15%', animationDuration: '2.5s', animationDelay: '0.5s' }}
      />
      <div
        className='absolute h-1 w-1 rounded-full bg-cyan-400/60 animate-bounce'
        style={{ top: '30%', right: '10%', animationDuration: '3s', animationDelay: '1s' }}
      />
    </div>
  )
}
