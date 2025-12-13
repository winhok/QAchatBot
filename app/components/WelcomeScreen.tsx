'use client'

import { AIOrb } from './AIOrb'
import {
  FileCode,
  TestTube2,
  Bug,
  BarChart3,
  HelpCircle,
  Headphones,
  BookOpen,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Construction,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import type { SessionType } from '@/app/types/stores'

interface WelcomeScreenProps {
  onFeatureClick: (feature: string, type?: SessionType) => void
}

const getTimeGreeting = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return '早上好'
  if (hour >= 12 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 18) return '下午好'
  return '晚上好'
}

const welcomeMessages = [
  {
    headline: '让测试更智能',
    subtitle: 'AI 驱动的测试用例生成，告别手动编写的繁琐',
    highlightColor: 'from-teal-400 to-cyan-400',
  },
  {
    headline: '释放你的生产力',
    subtitle: '一句话生成完整测试方案，专注于更有价值的工作',
    highlightColor: 'from-emerald-400 to-teal-400',
  },
  {
    headline: '你的 QA 智能伙伴',
    subtitle: '无论是测试设计还是问题咨询，随时为你提供专业支持',
    highlightColor: 'from-cyan-400 to-blue-400',
  },
]

const featureTips = [
  '试试输入「帮我设计登录模块的测试用例」开始测试设计',
  '可以直接描述功能需求，AI 会生成对应的测试场景',
  '有任何测试相关的问题，都可以向 AI 助手咨询',
]

export function WelcomeScreen({ onFeatureClick }: WelcomeScreenProps) {
  const [welcomeIndex, setWelcomeIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    setWelcomeIndex(Math.floor(Math.random() * welcomeMessages.length))
    setTipIndex(Math.floor(Math.random() * featureTips.length))
  }, [])

  const timeGreeting = useMemo(() => getTimeGreeting(), [])
  const currentWelcome = welcomeMessages[welcomeIndex]
  const currentTip = featureTips[tipIndex]

  const primaryFeatures = [
    {
      icon: MessageSquare,
      title: '普通聊天',
      description: '与 AI 助手自由对话交流',
      iconColor: 'text-emerald-400',
      bgGradient: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/20',
      type: 'normal' as SessionType,
      implemented: true,
    },
    {
      icon: TestTube2,
      title: '测试用例设计',
      description: '智能生成测试用例和测试方案',
      iconColor: 'text-teal-400',
      bgGradient: 'from-teal-500/20 to-teal-500/5',
      borderColor: 'border-teal-500/20',
      type: 'testcase' as SessionType,
      implemented: true,
    },
    {
      icon: FileCode,
      title: '接口测试',
      description: '自动执行 API 请求，验证响应结果',
      iconColor: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/20',
      implemented: false,
    },
    {
      icon: Bug,
      title: 'Bug 分析',
      description: '智能分析错误日志，定位问题根因',
      iconColor: 'text-red-400',
      bgGradient: 'from-red-500/20 to-red-500/5',
      borderColor: 'border-red-500/20',
      implemented: false,
    },
  ]

  const secondaryFeatures = [
    { icon: BarChart3, label: '测试报告', color: 'text-amber-400', implemented: false },
    { icon: HelpCircle, label: '使用帮助', color: 'text-purple-400', implemented: false },
    { icon: BookOpen, label: '测试知识库', color: 'text-cyan-400', implemented: false },
    { icon: Lightbulb, label: '测试建议', color: 'text-orange-400', implemented: false },
    { icon: Headphones, label: '问题反馈', color: 'text-pink-400', implemented: false },
  ]

  const handleFeatureClick = (feature: (typeof primaryFeatures)[0]) => {
    if (!feature.implemented) {
      return
    }
    onFeatureClick(feature.title, feature.type)
  }

  return (
    <div className='flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto'>
      {/* AI Orb Animation */}
      <div className='mb-6'>
        <AIOrb />
      </div>

      <div className='text-center mb-10 space-y-4'>
        {/* 时间问候语 */}
        <p className='text-muted-foreground text-sm flex items-center justify-center gap-2'>
          <Sparkles className='h-4 w-4 text-amber-400' />
          {timeGreeting}，有什么可以帮助你的？
        </p>

        {/* 主标题 - 随机切换 */}
        <h1 className='text-4xl font-bold text-foreground md:text-5xl tracking-tight'>
          <span className={`bg-gradient-to-r ${currentWelcome.highlightColor} bg-clip-text text-transparent`}>
            {currentWelcome.headline}
          </span>
        </h1>

        {/* 副标题 */}
        <p className='max-w-lg mx-auto text-muted-foreground text-lg'>{currentWelcome.subtitle}</p>

        {/* 功能提示 */}
        <div className='inline-flex items-center gap-2 rounded-full bg-card/50 border border-border/50 px-4 py-2 text-sm text-muted-foreground'>
          <Lightbulb className='h-4 w-4 text-amber-400' />
          {currentTip}
        </div>
      </div>

      {/* Primary Feature Cards */}
      <div className='w-full max-w-4xl mb-8'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {primaryFeatures.map(feature => (
            <button
              key={feature.title}
              onClick={() => handleFeatureClick(feature)}
              disabled={!feature.implemented}
              aria-label={
                feature.implemented
                  ? `${feature.title} - 点击开始`
                  : `${feature.title} - 功能开发中`
              }
              className={`group relative overflow-hidden rounded-2xl border ${feature.borderColor} bg-gradient-to-b ${feature.bgGradient} p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${!feature.implemented && 'opacity-60 cursor-not-allowed'}`}
            >
              {/* 未实现标记 */}
              {!feature.implemented && (
                <div className='absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5'>
                  <Construction className='h-3 w-3 text-amber-400' />
                  <span className='text-[10px] text-amber-400'>开发中</span>
                </div>
              )}
              <div className='absolute inset-0 bg-gradient-to-b from-transparent to-background/80 opacity-0 group-hover:opacity-100 transition-opacity' />
              <div className='relative'>
                <div className='mb-3 inline-flex rounded-xl bg-background/50 p-2.5 backdrop-blur'>
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className='font-semibold text-foreground mb-1'>{feature.title}</h3>
                <p className='text-sm text-muted-foreground line-clamp-2'>{feature.description}</p>
                {feature.implemented && (
                  <ArrowRight className='absolute bottom-0 right-0 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-x-1' />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Features */}
      <div className='flex items-center gap-2 flex-wrap justify-center'>
        <span className='text-sm text-muted-foreground mr-2'>快速访问:</span>
        {secondaryFeatures.map(feature => (
          <button
            key={feature.label}
            disabled={!feature.implemented}
            aria-label={!feature.implemented ? `${feature.label}（暂不可用）` : feature.label}
            className={`inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-emerald-500/30 hover:bg-card hover:text-foreground ${!feature.implemented && 'opacity-60 cursor-not-allowed'}`}
          >
            <feature.icon className={`h-4 w-4 ${feature.color}`} />
            {feature.label}
            {!feature.implemented && <Construction className='h-3 w-3 text-amber-400 ml-1' />}
          </button>
        ))}
      </div>
    </div>
  )
}
