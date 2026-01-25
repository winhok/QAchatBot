import { motion } from 'framer-motion'
import { dotPulseVariants } from '@/lib/motion'

export function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotPulseVariants}
            animate="animate"
            className="h-2 w-2 rounded-full bg-emerald-400"
          />
        ))}
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        正在思考…
      </motion.span>
    </div>
  )
}

export function SkeletonLoader({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-2xl bg-muted px-4 py-3">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
          className="h-4 rounded bg-muted-foreground/20"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function TypewriterDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            repeat: Infinity,
            duration: 1,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-current"
        />
      ))}
    </span>
  )
}
