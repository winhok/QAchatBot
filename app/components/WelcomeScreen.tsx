'use client'

import { Sparkles, Zap, MessageSquare, Brain } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WelcomeScreenProps {
  onFeatureClick?: (prompt: string) => void
}

const WELCOME_TITLES = [
  '👋 你好！我是 AI 助手',
  '✨ 欢迎使用智能对话',
  '🚀 开启 AI 探索之旅',
  '💡 让我来帮助你',
]

const WELCOME_SUBTITLES = [
  '随时为您提供智能帮助',
  '强大的 AI 能力，触手可及',
  '让对话更智能，让工作更高效',
  '您的智能助手，随时待命',
]

const FEATURE_PROMPTS = [
  { icon: Brain, text: '帮我总结一段文本', prompt: '请帮我总结以下内容：' },
  { icon: MessageSquare, text: '写一篇文章大纲', prompt: '请帮我写一篇关于...的文章大纲' },
  { icon: Zap, text: '解释一个概念', prompt: '请解释一下...的概念' },
  { icon: Sparkles, text: '创意头脑风暴', prompt: '帮我进行创意头脑风暴：' },
]

export function WelcomeScreen({ onFeatureClick }: WelcomeScreenProps) {
  const [titleIndex, setTitleIndex] = useState(0)
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setTitleIndex(prev => (prev + 1) % WELCOME_TITLES.length)
        setSubtitleIndex(prev => (prev + 1) % WELCOME_SUBTITLES.length)
        setIsTransitioning(false)
      }, 300)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className='flex-1 flex items-center justify-center p-8'>
      <div className='max-w-2xl w-full space-y-8'>
        {/* Animated Title */}
        <div className='text-center space-y-3'>
          <div
            className={`text-4xl font-bold text-white transition-all duration-300 ${
              isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {WELCOME_TITLES[titleIndex]}
          </div>
          <div
            className={`text-lg text-purple-200 transition-all duration-300 ${
              isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {WELCOME_SUBTITLES[subtitleIndex]}
          </div>
        </div>

        {/* Feature Prompt Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {FEATURE_PROMPTS.map((feature, index) => {
            const Icon = feature.icon
            return (
              <button
                key={index}
                onClick={() => onFeatureClick?.(feature.prompt)}
                className='group backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 text-left transform hover:scale-[1.02] active:scale-[0.98]'
              >
                <div className='flex items-start gap-4'>
                  <div className='shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-cyan-500/30 transition-all duration-300'>
                    <Icon className='h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-white font-medium group-hover:text-purple-100 transition-colors duration-300'>
                      {feature.text}
                    </div>
                    <div className='text-sm text-purple-300 mt-1 truncate'>{feature.prompt}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Helper Text */}
        <div className='text-center text-sm text-purple-300'>
          <p>💡 点击上方卡片快速开始对话，或在下方输入框输入您的问题</p>
        </div>
      </div>
    </div>
  )
}
