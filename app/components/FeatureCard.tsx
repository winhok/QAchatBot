'use client'

import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  onClick?: () => void
  disabled?: boolean
  badge?: string
  comingSoon?: boolean
}

export function FeatureCard({ icon: Icon, title, description, onClick, disabled = false, badge, comingSoon = false }: FeatureCardProps) {
  const isDisabled = disabled || comingSoon

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 text-left transition-all duration-300 ${
        isDisabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:bg-white/15 hover:border-white/30 hover:shadow-xl hover:shadow-purple-500/10 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className='absolute -top-2 -right-2 px-2 py-1 bg-linear-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-lg'>
          开发中
        </div>
      )}

      {/* Custom Badge */}
      {badge && !comingSoon && (
        <div className='absolute -top-2 -right-2 px-2 py-1 bg-linear-to-r from-purple-500 to-cyan-500 text-white text-xs font-semibold rounded-full shadow-lg'>
          {badge}
        </div>
      )}

      <div className='flex items-start gap-4'>
        <div
          className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isDisabled
              ? 'bg-linear-to-br from-gray-500/20 to-gray-600/20'
              : 'bg-linear-to-br from-purple-500/20 to-cyan-500/20 group-hover:from-purple-500/30 group-hover:to-cyan-500/30'
          }`}
        >
          <Icon className={`h-6 w-6 transition-colors duration-300 ${isDisabled ? 'text-gray-400' : 'text-purple-300'}`} />
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className={`font-semibold mb-1 transition-colors duration-300 ${isDisabled ? 'text-gray-300' : 'text-white group-hover:text-purple-100'}`}>
            {title}
          </h3>
          <p className={`text-sm transition-colors duration-300 ${isDisabled ? 'text-gray-400' : 'text-purple-300'}`}>{description}</p>
        </div>
      </div>
    </button>
  )
}
