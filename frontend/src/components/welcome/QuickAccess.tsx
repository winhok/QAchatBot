import { motion } from 'framer-motion'
import { BarChart3, BookOpen, Headphones, HelpCircle, Lightbulb } from 'lucide-react'

const secondaryFeatures = [
  { icon: BarChart3, label: '测试报告', implemented: false },
  { icon: HelpCircle, label: '操作手册', implemented: false },
  { icon: BookOpen, label: '知识库', implemented: false },
  { icon: Lightbulb, label: '提示词', implemented: false },
  { icon: Headphones, label: '技术支持', implemented: false },
]

export function QuickAccess() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="flex items-center gap-4 flex-wrap justify-center"
    >
      <span className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
        [ 数据访问 ]
      </span>
      <div className="h-px w-8 bg-border/50" />

      {secondaryFeatures.map((feature) => (
        <button
          key={feature.label}
          disabled={!feature.implemented}
          className={`
            group flex items-center gap-2 px-3 py-1.5 
            border border-transparent hover:border-border/50 rounded-sm
            text-xs font-mono text-muted-foreground transition-all
            ${!feature.implemented && 'opacity-40 cursor-not-allowed'}
          `}
        >
          <feature.icon className="h-3 w-3 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-foreground transition-colors">{feature.label}</span>
        </button>
      ))}
    </motion.div>
  )
}
