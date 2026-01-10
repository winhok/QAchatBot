import { SessionType } from '@/types/stores'
import { motion } from 'framer-motion'
import { ArrowRight, Bug, FileCode, MessageSquare, TestTube2 } from 'lucide-react'

export interface FeatureItem {
  icon: typeof MessageSquare
  title: string
  description: string
  code: string
  type: SessionType
  implemented: boolean
}

const primaryFeatures: FeatureItem[] = [
  {
    icon: MessageSquare,
    title: '自由对话',
    description: '通用人工智能助手协议。',
    code: '0x01',
    type: 'normal',
    implemented: true,
  },
  {
    icon: TestTube2,
    title: '测试生成',
    description: '自动化测试套件生成模块。',
    code: '0x02',
    type: 'testcase',
    implemented: true,
  },
  {
    icon: FileCode,
    title: 'API审计',
    description: '端点验证与压力测试。',
    code: '0x03',
    type: 'normal', // Placeholder
    implemented: false,
  },
  {
    icon: Bug,
    title: '日志分析',
    description: '错误模式识别与诊断。',
    code: '0x04',
    type: 'normal', // Placeholder
    implemented: false,
  },
]

interface FeatureGridProps {
  onFeatureClick: (feature: FeatureItem) => void
}

export function FeatureGrid({ onFeatureClick }: FeatureGridProps) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="w-full max-w-5xl mb-12"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {primaryFeatures.map((feature) => (
          <button
            key={feature.title}
            onClick={() => onFeatureClick(feature)}
            disabled={!feature.implemented}
            className={`group relative overflow-hidden rounded-sm border border-border/40 bg-card/10 p-5 text-left transition-all hover:border-primary/50 hover:bg-card/20 ${
              !feature.implemented && 'opacity-50 cursor-not-allowed grayscale'
            }`}
          >
            {/* Hover Decor - Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary/0 group-hover:border-primary/100 transition-colors" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-primary/0 group-hover:border-primary/100 transition-colors" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-primary/0 group-hover:border-primary/100 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary/0 group-hover:border-primary/100 transition-colors" />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {feature.code}
                </span>
              </div>

              <h3 className="font-bold text-foreground mb-2 font-mono tracking-tight">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Status Badge */}
            {!feature.implemented && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1">
                <span className="text-[10px] font-mono text-yellow-500/80 uppercase">离线</span>
              </div>
            )}
            {feature.implemented && (
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
