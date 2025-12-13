'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { MessageCircle, X, TestTube2, FlaskConical } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { SessionType } from '@/app/types/stores'

interface FloatingChatBubbleProps {
  onQuickAction: (action: string, type: SessionType) => void
}

export function FloatingChatBubble({ onQuickAction }: FloatingChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sessionTypeActions = [
    {
      label: '开始普通聊天',
      action: 'normal',
      type: 'normal' as SessionType,
      icon: MessageCircle,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: '设计测试用例',
      action: 'testcase',
      type: 'testcase' as SessionType,
      icon: TestTube2,
      color: 'from-blue-500 to-cyan-600',
    },
  ]

  const handleSessionTypeChange = (action: (typeof sessionTypeActions)[0]) => {
    setIsOpen(false)
    onQuickAction(action.action, action.type)
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      {/* Menu Card */}
      {isOpen && (
        <Card className='absolute bottom-16 right-0 w-64 p-2 mb-2 shadow-xl border-border/50 bg-card/95 backdrop-blur-xl'>
          <div className='space-y-1'>
            {sessionTypeActions.map(action => (
              <Button
                key={action.action}
                variant='ghost'
                className='w-full justify-start gap-3 h-auto py-3 hover:bg-accent'
                onClick={() => handleSessionTypeChange(action)}
              >
                <div className={cn('p-2 rounded-lg bg-gradient-to-br', action.color)}>
                  <action.icon className='h-4 w-4 text-white' />
                </div>
                <span className='text-sm'>{action.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Floating Button */}
      <Button
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '关闭快速切换菜单' : '打开快速切换菜单'}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
          'hover:scale-110 active:scale-95'
        )}
      >
        {isOpen ? <X className='h-6 w-6 text-white' /> : <FlaskConical className='h-6 w-6 text-white' />}
      </Button>
    </div>
  )
}
