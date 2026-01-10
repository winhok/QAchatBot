import { motion } from 'framer-motion'
import { MessageSquare, TestTube2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ModeViewProps {
  resetToLobby: () => void
}

const TESTCASE_STEPS = [
  { step: '01', title: '需求输入', desc: '粘贴 PRD 或需求文本' },
  { step: '02', title: 'AI 智能分析', desc: '提取测试场景' },
  { step: '03', title: '人工审核', desc: '验证并调整计划' },
  { step: '04', title: '生成用例', desc: '输出结构化用例' },
]

export function TestCaseModeView({ resetToLobby }: ModeViewProps) {
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
        {TESTCASE_STEPS.map((item) => (
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

export function NormalModeView({ resetToLobby }: ModeViewProps) {
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
