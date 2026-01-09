import { AIOrb } from '@/components/AIOrb'
import { Badge } from '@/components/ui/badge'
import { useQuickAction } from '@/hooks/useQuickAction'
import { useSession } from '@/stores/useSession'
import type { SessionType } from '@/types/stores'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bug,
  CheckCircle2,
  Construction,
  FileCode,
  Headphones,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  TestTube2,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore, useTransition } from 'react'

const STORAGE_KEY = 'last_welcome_index'
const TIP_STORAGE_KEY = 'last_tip_index'

interface WelcomeMessage {
  headline: (context: { time: string; user?: string }) => string
  subtitle: string
  highlightColor: string
}

const getTimeGreeting = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return '早上好'
  if (hour >= 12 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 18) return '下午好'
  return '晚上好'
}

const welcomeMessages: Array<WelcomeMessage> = [
  {
    headline: ({ time }) => `${time}，让测试更智能`,
    subtitle: 'AI 驱动的测试用例生成，告别手动编写的繁琐',
    highlightColor: 'from-teal-400 to-cyan-400',
  },
  {
    headline: ({ time }) => `${time}，释放你的生产力`,
    subtitle: '一句话生成完整测试方案，专注于更有价值的工作',
    highlightColor: 'from-emerald-400 to-teal-400',
  },
  {
    headline: ({ time }) => `${time}，我是你的 QA 伙伴`,
    subtitle: '无论是测试设计还是问题咨询，随时为你提供专业支持',
    highlightColor: 'from-cyan-400 to-blue-400',
  },
  {
    headline: ({ time }) => `${time}，测试从这里开始`,
    subtitle: '描述你的需求，AI 帮你规划测试策略和用例设计',
    highlightColor: 'from-purple-400 to-pink-400',
  },
  {
    headline: ({ time }) => `${time}，今天想更聪明地工作吗？`,
    subtitle: 'AI 辅助分析、生成、优化，让测试工作事半功倍',
    highlightColor: 'from-amber-400 to-orange-400',
  },
]

const featureTips = [
  '试试输入「帮我设计登录模块的测试用例」开始测试设计',
  '可以直接描述功能需求，AI 会生成对应的测试场景',
  '上传接口文档，快速生成接口测试用例',
  '有任何测试相关的问题，都可以向 AI 助手咨询',
]

/**
 * 随机选择索引，确保不与上次重复
 */
export function getRandomIndex(length: number, lastIndex: number | null): number {
  if (length <= 1) return 0
  let nextIndex: number
  do {
    nextIndex = Math.floor(Math.random() * length)
  } while (nextIndex === lastIndex)
  return nextIndex
}

export function WelcomeScreen() {
  const { startNewSession, resetToLobby } = useQuickAction()
  const sessionId = useSession((s) => s.sessionId)
  const sessionType = useSession((s) => s.sessionType)
  const hasModeSelected = useSession((s) => s.hasModeSelected)
  const welcomeRefreshTrigger = useSession((s) => s.welcomeRefreshTrigger)
  const [welcomeIndex, setWelcomeIndex] = useState<number | null>(null)
  const [tipIndex, setTipIndex] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [_isPending, startTransition] = useTransition()

  // 1. 初始挂载随机化
  useEffect(() => {
    const lastWelcome = localStorage.getItem(STORAGE_KEY)
    const lastTip = localStorage.getItem(TIP_STORAGE_KEY)

    const nextWelcome = getRandomIndex(
      welcomeMessages.length,
      lastWelcome ? parseInt(lastWelcome) : null,
    )
    const nextTip = getRandomIndex(featureTips.length, lastTip ? parseInt(lastTip) : null)

    startTransition(() => {
      setIsMounted(true)
      setWelcomeIndex(nextWelcome)
      setTipIndex(nextTip)
    })

    localStorage.setItem(STORAGE_KEY, nextWelcome.toString())
    localStorage.setItem(TIP_STORAGE_KEY, nextTip.toString())
  }, [])

  // 2. 监听 sessionId 变化或刷新触发器
  useEffect(() => {
    // 逻辑：
    // 1. 如果是从具体会话切换到首页 (sessionId 变为空)
    // 2. 或者已经在首页时手动触发了刷新 (welcomeRefreshTrigger 变化)
    if (isMounted && sessionId === '') {
      startTransition(() => {
        setWelcomeIndex((prev) => {
          const next = getRandomIndex(welcomeMessages.length, prev)
          localStorage.setItem(STORAGE_KEY, next.toString())
          return next
        })
        setTipIndex((prev) => {
          const next = getRandomIndex(featureTips.length, prev)
          localStorage.setItem(TIP_STORAGE_KEY, next.toString())
          return next
        })
      })
    }
  }, [sessionId, welcomeRefreshTrigger, isMounted])

  // 3. 自动播放逻辑：每 15 秒随机切换一次
  useEffect(() => {
    if (!isMounted || welcomeIndex === null || tipIndex === null) return

    const interval = setInterval(() => {
      startTransition(() => {
        setWelcomeIndex((prev) => {
          const next = getRandomIndex(welcomeMessages.length, prev)
          localStorage.setItem(STORAGE_KEY, next.toString())
          return next
        })
        setTipIndex((prev) => {
          const next = getRandomIndex(featureTips.length, prev)
          localStorage.setItem(TIP_STORAGE_KEY, next.toString())
          return next
        })
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [isMounted, welcomeIndex, tipIndex])

  const timeGreeting = useSyncExternalStore(
    () => () => {},
    () => getTimeGreeting(),
    () => '你好',
  )

  // 防止 Hydration 不匹配
  if (!isMounted || welcomeIndex === null || tipIndex === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 opacity-0">
        <AIOrb />
      </div>
    )
  }

  const currentWelcome = welcomeMessages[welcomeIndex]
  const currentTip = featureTips[tipIndex]
  const headlineText = currentWelcome.headline({ time: timeGreeting })

  const isTestcaseMode = hasModeSelected && sessionType === 'testcase'
  const isNormalChatMode = hasModeSelected && sessionType === 'normal'

  const testcaseSteps = [
    { step: 1, title: '输入需求', desc: '粘贴 PRD 文档或描述功能需求' },
    { step: 2, title: 'AI 分析', desc: '智能提取测试点和场景' },
    { step: 3, title: '审核确认', desc: '逐阶段审核，可随时修改' },
    { step: 4, title: '生成用例', desc: '输出结构化测试用例' },
  ]

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
    {
      icon: BarChart3,
      label: '测试报告',
      color: 'text-amber-400',
      implemented: false,
    },
    {
      icon: HelpCircle,
      label: '使用帮助',
      color: 'text-purple-400',
      implemented: false,
    },
    {
      icon: BookOpen,
      label: '测试知识库',
      color: 'text-cyan-400',
      implemented: false,
    },
    {
      icon: Lightbulb,
      label: '测试建议',
      color: 'text-orange-400',
      implemented: false,
    },
    {
      icon: Headphones,
      label: '问题反馈',
      color: 'text-pink-400',
      implemented: false,
    },
  ]

  const handleFeatureClick = (feature: (typeof primaryFeatures)[0]) => {
    if (!feature.implemented || !feature.type) {
      return
    }
    startNewSession(feature.type)
  }

  if (isTestcaseMode) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-teal-500/30 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
              <TestTube2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </motion.div>

        <div className="text-center mb-8 space-y-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="teal" className="gap-1.5 mb-4">
              <TestTube2 className="h-3 w-3" />
              测试设计模式
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground md:text-4xl tracking-tight"
          >
            <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              智能测试用例生成
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto text-muted-foreground"
          >
            输入 PRD 需求文档，AI 将分阶段引导你完成测试用例设计
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-2xl mb-8"
        >
          <div className="grid grid-cols-4 gap-3">
            {testcaseSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="relative flex flex-col items-center text-center p-4 rounded-xl border border-teal-500/20 bg-linear-to-b from-teal-500/10 to-transparent"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-semibold text-sm mb-3">
                  {item.step}
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                {index < testcaseSteps.length - 1 && (
                  <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500/50 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
            支持 Human-in-the-Loop 模式，每个阶段可审核修改
          </div>

          <button
            onClick={resetToLobby}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            返回功能选择
          </button>
        </motion.div>
      </div>
    )
  }

  if (isNormalChatMode) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
          </div>
        </motion.div>

        <div className="text-center mb-8 space-y-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="success" className="gap-1.5 mb-4">
              <MessageSquare className="h-3 w-3" />
              普通聊天模式
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground md:text-4xl tracking-tight"
          >
            <span className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {timeGreeting}，有什么可以帮你的？
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto text-muted-foreground"
          >
            与 AI 助手自由对话，获取测试相关的专业建议和解答
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-lg mb-8"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Lightbulb, text: '咨询测试策略和方法论' },
              { icon: HelpCircle, text: '解答测试相关疑问' },
              { icon: BookOpen, text: '获取测试最佳实践' },
              { icon: Sparkles, text: '头脑风暴测试思路' },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.08 }}
                className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-sm text-muted-foreground"
              >
                <item.icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            在下方输入框开始对话
          </div>

          <button
            onClick={resetToLobby}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            返回功能选择
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto">
      {/* AI Orb Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6"
      >
        <AIOrb />
      </motion.div>

      <div className="text-center mb-10 space-y-4">
        {/* 时间问候语 */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          {timeGreeting}，有什么可以帮助你的？
        </motion.p>

        {/* 主标题 - 随机切换 */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={welcomeIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="text-4xl font-bold text-foreground md:text-5xl tracking-tight"
          >
            <span
              className={`bg-linear-to-r ${currentWelcome.highlightColor} bg-clip-text text-transparent`}
            >
              {headlineText}
            </span>
          </motion.h1>
        </AnimatePresence>

        {/* 副标题 */}
        <AnimatePresence mode="wait">
          <motion.p
            key={welcomeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-lg mx-auto text-muted-foreground text-lg"
          >
            {currentWelcome.subtitle}
          </motion.p>
        </AnimatePresence>

        {/* 功能提示 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-card/50 border border-border/50 px-4 py-2 text-sm text-muted-foreground"
          >
            <Lightbulb className="h-4 w-4 text-amber-400" />
            {currentTip}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Primary Feature Cards */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-4xl mb-8"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primaryFeatures.map((feature) => (
            <button
              key={feature.title}
              onClick={() => handleFeatureClick(feature)}
              disabled={!feature.implemented}
              aria-label={
                feature.implemented
                  ? `${feature.title} - 点击开始`
                  : `${feature.title} - 功能开发中`
              }
              className={`group relative overflow-hidden rounded-2xl border ${feature.borderColor} bg-linear-to-b ${feature.bgGradient} p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${!feature.implemented && 'opacity-60 cursor-not-allowed'}`}
            >
              {/* 未实现标记 */}
              {!feature.implemented && (
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5">
                  <Construction className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400">开发中</span>
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-background/80 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="mb-3 inline-flex rounded-xl bg-background/50 p-2.5 backdrop-blur">
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
                {feature.implemented && (
                  <ArrowRight className="absolute bottom-0 right-0 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-x-1" />
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Secondary Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 flex-wrap justify-center"
      >
        <span className="text-sm text-muted-foreground mr-2">快速访问:</span>
        {secondaryFeatures.map((feature) => (
          <button
            key={feature.label}
            disabled={!feature.implemented}
            aria-label={!feature.implemented ? `${feature.label}（暂不可用）` : feature.label}
            className={`inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-emerald-500/30 hover:bg-card hover:text-foreground ${!feature.implemented && 'opacity-60 cursor-not-allowed'}`}
          >
            <feature.icon className={`h-4 w-4 ${feature.color}`} />
            {feature.label}
            {!feature.implemented && <Construction className="h-3 w-3 text-amber-400 ml-1" />}
          </button>
        ))}
      </motion.div>
    </div>
  )
}
