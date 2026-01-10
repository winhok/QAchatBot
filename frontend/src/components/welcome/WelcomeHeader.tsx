import { AnimatePresence, motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import { welcomeMessages } from './constants'
import { AIOrb } from '@/components/AIOrb'

interface WelcomeHeaderProps {
  welcomeIndex: number
  tipIndex: number
  currentTip: string
  timeGreeting: string
}

export function WelcomeHeader({
  welcomeIndex,
  tipIndex,
  currentTip,
  timeGreeting,
}: WelcomeHeaderProps) {
  const currentWelcome = welcomeMessages[welcomeIndex]
  const headlineText = currentWelcome.headline({ time: timeGreeting })

  return (
    <>
      {/* AI Orb Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8"
      >
        <AIOrb />
      </motion.div>

      <div className="text-center mb-12 space-y-4">
        {/* System Status Line */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground/80 tracking-widest"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>系统就绪</span>
        </motion.div>

        {/* Friendly Time Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-medium text-primary/80"
        >
          {timeGreeting}，有什么可以帮您？
        </motion.div>

        {/* Main Title - Glitch/Tech Effect */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={welcomeIndex}
            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: 'circOut' }}
            className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground"
          >
            <span className="text-primary mr-3">&gt;</span>
            {headlineText}
          </motion.h1>
        </AnimatePresence>

        {/* Subtitle */}
        <AnimatePresence mode="wait">
          <motion.p
            key={welcomeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-mono text-sm md:text-base text-muted-foreground tracking-wide uppercase"
          >
            {currentWelcome.subtitle}
          </motion.p>
        </AnimatePresence>

        {/* Console Tip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            className="inline-flex items-center gap-3 mt-6 px-4 py-2 bg-black/40 border border-primary/20 rounded-md backdrop-blur-md"
          >
            <Terminal className="h-3 w-3 text-primary" />
            <span className="font-mono text-xs text-primary/80">{currentTip}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
