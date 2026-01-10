import { useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import { featureTips, getRandomIndex, getTimeGreeting, welcomeMessages } from './welcome/constants'
import { FeatureGrid } from './welcome/FeatureGrid'
import { NormalModeView, TestCaseModeView } from './welcome/ModeViews'
import { QuickAccess } from './welcome/QuickAccess'
import { WelcomeHeader } from './welcome/WelcomeHeader'
import type { FeatureItem } from './welcome/FeatureGrid'
import { useSession } from '@/stores/useSession'
import { useQuickAction } from '@/hooks/useQuickAction'
import { AIOrb } from '@/components/AIOrb'

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

  function handleFeatureClick(feature: FeatureItem): void {
    if (!feature.implemented) {
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
