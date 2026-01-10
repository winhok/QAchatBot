import { AIOrb } from '@/components/AIOrb'
import { Badge } from '@/components/ui/badge'
import { useQuickAction } from '@/hooks/useQuickAction'
import { useSession } from '@/stores/useSession'
import { motion } from 'framer-motion'
import { MessageSquare, TestTube2 } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import { featureTips, getRandomIndex, getTimeGreeting, welcomeMessages } from './welcome/constants'
import { FeatureGrid, FeatureItem } from './welcome/FeatureGrid'
import { QuickAccess } from './welcome/QuickAccess'
import { WelcomeHeader } from './welcome/WelcomeHeader'

const STORAGE_KEY = 'last_welcome_index'
const TIP_STORAGE_KEY = 'last_tip_index'

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

  // 3. 自动播放逻辑
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
    () => 'STANDBY',
  )

  const handleFeatureClick = (feature: FeatureItem) => {
    if (!feature.implemented || !feature.type) {
      return
    }
    startNewSession(feature.type)
  }

  // 防止 Hydration 不匹配
  if (!isMounted || welcomeIndex === null || tipIndex === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 opacity-0">
        <AIOrb />
      </div>
    )
  }

  const currentTip = featureTips[tipIndex]

  // IMPORTANT: For now, I'm hiding the specific "Mode" views (TestCaseMode/NormalMode)
  // inside the main refactor, but in a real scenario, we should also componentize them.
  // For this pass, I'll fallback to the default "Lobby" view if not in a specific session,
  // or show a simplified version of the mode view.

  // Actually, let's keep the lobby cleanly separate.
  // If hasModeSelected is true, we should probably be in the chat interface anyway.
  // But WelcomeScreen is rendered INSIDE the chat area when empty.
  // So we do need to handle "Testcase Mode Initial State" etc.

  if (hasModeSelected && sessionType === 'testcase') {
    return <TestCaseModeView resetToLobby={resetToLobby} />
  }

  if (hasModeSelected && sessionType === 'normal') {
    return <NormalModeView resetToLobby={resetToLobby} />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto min-h-full">
      <WelcomeHeader
        welcomeIndex={welcomeIndex}
        tipIndex={tipIndex}
        currentTip={currentTip}
        timeGreeting={timeGreeting}
      />

      <FeatureGrid onFeatureClick={handleFeatureClick} />

      <QuickAccess />
    </div>
  )
}

// --- Sub Views for Modes (Can be extracted later) ---

function TestCaseModeView({ resetToLobby }: { resetToLobby: () => void }) {
  const testcaseSteps = [
    { step: '01', title: '需求输入', desc: '粘贴 PRD 或需求文本' },
    { step: '02', title: 'AI 智能分析', desc: '提取测试场景' },
    { step: '03', title: '人工审核', desc: '验证并调整计划' },
    { step: '04', title: '生成用例', desc: '输出结构化用例' },
  ]

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 relative"
      >
        <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full" />
        <TestTube2 className="h-16 w-16 text-teal-400 relative z-10" />
      </motion.div>

      <div className="text-center mb-10 space-y-2">
        <Badge
          variant="outline"
          className="font-mono border-teal-500/50 text-teal-400 bg-teal-500/10 mb-4"
        >
          模式: 测试设计
        </Badge>
        <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">
          测试用例生成器
        </h1>
        <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
          等待 PRD 输入以初始化生成序列...
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full max-w-3xl mb-12">
        {testcaseSteps.map((item) => (
          <div
            key={item.step}
            className="border border-border/50 bg-card/20 p-4 rounded-sm relative overflow-hidden"
          >
            <div className="text-4xl font-mono font-bold text-muted-foreground/10 absolute -right-2 -bottom-4">
              {item.step}
            </div>
            <div className="text-xs font-mono text-teal-500 mb-2">{item.step} //</div>
            <h4 className="font-bold text-sm mb-1">{item.title}</h4>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={resetToLobby}
        className="text-xs font-mono text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4"
      >
        [ 中止模式 ]
      </button>
    </div>
  )
}

function NormalModeView({ resetToLobby }: { resetToLobby: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 overflow-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 relative"
      >
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
        <MessageSquare className="h-16 w-16 text-emerald-400 relative z-10" />
      </motion.div>

      <div className="text-center mb-12 space-y-2">
        <Badge
          variant="outline"
          className="font-mono border-emerald-500/50 text-emerald-400 bg-emerald-500/10 mb-4"
        >
          模式: 自由对话
        </Badge>
        <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">
          有什么可以帮您？
        </h1>
        <p className="text-muted-foreground font-mono text-sm">系统就绪，等待指令。</p>
      </div>

      <button
        onClick={resetToLobby}
        className="text-xs font-mono text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4"
      >
        [ 返回菜单 ]
      </button>
    </div>
  )
}
