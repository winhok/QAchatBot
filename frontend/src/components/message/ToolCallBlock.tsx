import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, ChevronRight, Clock, Database, Globe, Wrench, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { ToolCallData } from '@/schemas'
import { CodeBlock } from '@/components/common/code-block'
import { Loader } from '@/components/common/loader'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toolCallExpandVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ToolCallBlockProps {
  data: ToolCallData
}

const STATUS_CONFIG = {
  running: {
    label: '执行中',
    icon: <Loader size={14} className="text-blue-500" />,
    badgeClass: 'gap-1.5 bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  success: {
    label: '完成',
    icon: <CheckCircle className="size-4 text-emerald-500" />,
    badgeClass: 'gap-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  error: {
    label: '错误',
    icon: <XCircle className="size-4 text-red-500" />,
    badgeClass: 'gap-1.5 bg-red-500/10 text-red-500 border-red-500/20',
  },
} as const

const TOOL_ICONS = {
  api: Globe,
  database: Database,
  script: Wrench,
} as const

export function ToolCallBlock({ data }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false)

  const config = STATUS_CONFIG[data.status]
  const ToolIcon = TOOL_ICONS[data.type]
  const isError = data.status === 'error'
  const hasDetails = data.input || data.output

  return (
    <Card className="border-border/50 bg-card/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer"
        aria-expanded={expanded}
        aria-label={`工具调用: ${data.name}, 状态: ${config.label}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ToolIcon className="size-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">{data.name}</span>
              <Badge variant="outline" className={cn('text-xs', config.badgeClass)}>
                {config.icon}
                {config.label}
              </Badge>
            </div>
            {data.duration !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="size-3" />
                <span>{data.duration}ms</span>
              </div>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center"
        >
          <ChevronRight className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            variants={toolCallExpandVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="border-t border-border/50 overflow-hidden"
          >
            {data.input && (
              <div className="p-3 border-b border-border/30">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  参数
                </h4>
                <CodeBlock
                  code={JSON.stringify(data.input, null, 2)}
                  language="json"
                  maxHeight={200}
                />
              </div>
            )}
            {data.output && (
              <div className="p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {isError ? '错误' : '结果'}
                </h4>
                <div
                  className={cn('rounded-md', isError && 'bg-red-500/5 border border-red-500/20')}
                >
                  <CodeBlock
                    code={JSON.stringify(data.output, null, 2)}
                    language="json"
                    maxHeight={300}
                    className={isError ? 'text-red-500' : undefined}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
