import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useQuickAction } from '@/hooks/useQuickAction'
import { cn } from '@/lib/utils'
import { useChatMessages } from '@/stores/useChatMessages'
import { useSession } from '@/stores/useSession'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp,
  Command,
  FlaskConical,
  Home,
  Keyboard,
  MessageSquare,
  Sparkles,
  TestTube2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type DockSide = 'none' | 'left' | 'right' | 'top' | 'bottom'

interface Position {
  x: number
  y: number
}

const EDGE_THRESHOLD = 50
const DOCK_OFFSET = 6
const BUBBLE_SIZE = 56

const quickPrompts = [
  { label: '测试策略建议', prompt: '请给我一些关于这个功能的测试策略建议：' },
  { label: '边界值分析', prompt: '请帮我分析以下输入字段的边界值：' },
  { label: '异常场景', prompt: '请列出可能的异常场景和错误处理：' },
  { label: '性能测试点', prompt: '请分析需要关注的性能测试点：' },
]

const SESSION_CONFIG = {
  normal: {
    label: '普通聊天',
    icon: MessageSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  testcase: {
    label: '测试设计',
    icon: TestTube2,
    color: 'text-teal-400',
    bg: 'bg-teal-500/20',
  },
}

export function FloatingChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { resetToLobby } = useQuickAction()

  const sessionId = useSession((s) => s.sessionId)
  const sessionType = useSession((s) => s.sessionType)
  const hasModeSelected = useSession((s) => s.hasModeSelected)
  const setDraftMessage = useChatMessages((s) => s.setDraftMessage)
  const draftMessage = useChatMessages((s) => s.draftMessage)

  const [position, setPosition] = useState<Position>(() => ({
    x:
      typeof window !== 'undefined'
        ? window.innerWidth - BUBBLE_SIZE - DOCK_OFFSET
        : 100,
    y:
      typeof window !== 'undefined'
        ? window.innerHeight - BUBBLE_SIZE - DOCK_OFFSET
        : 100,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const [dockedSide, setDockedSide] = useState<DockSide>('none')
  const [isHovered, setIsHovered] = useState(false)
  const dragStartRef = useRef<{
    x: number
    y: number
    posX: number
    posY: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const config = SESSION_CONFIG[sessionType] || SESSION_CONFIG.normal
  const ModeIcon = config.icon

  const calculateDockSide = (x: number, y: number): DockSide => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    if (x <= EDGE_THRESHOLD) return 'left'
    if (x >= windowWidth - BUBBLE_SIZE - EDGE_THRESHOLD) return 'right'
    if (y <= EDGE_THRESHOLD) return 'top'
    if (y >= windowHeight - BUBBLE_SIZE - EDGE_THRESHOLD) return 'bottom'
    return 'none'
  }

  const snapToEdge = (x: number, y: number): Position => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const side = calculateDockSide(x, y)

    switch (side) {
      case 'left':
        return {
          x: DOCK_OFFSET,
          y: Math.max(
            DOCK_OFFSET,
            Math.min(y, windowHeight - BUBBLE_SIZE - DOCK_OFFSET),
          ),
        }
      case 'right':
        return {
          x: windowWidth - BUBBLE_SIZE - DOCK_OFFSET,
          y: Math.max(
            DOCK_OFFSET,
            Math.min(y, windowHeight - BUBBLE_SIZE - DOCK_OFFSET),
          ),
        }
      case 'top':
        return {
          x: Math.max(
            DOCK_OFFSET,
            Math.min(x, windowWidth - BUBBLE_SIZE - DOCK_OFFSET),
          ),
          y: DOCK_OFFSET,
        }
      case 'bottom':
        return {
          x: Math.max(
            DOCK_OFFSET,
            Math.min(x, windowWidth - BUBBLE_SIZE - DOCK_OFFSET),
          ),
          y: windowHeight - BUBBLE_SIZE - DOCK_OFFSET,
        }
      default:
        return { x, y }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      const newX = Math.max(
        0,
        Math.min(
          dragStartRef.current.posX + deltaX,
          window.innerWidth - BUBBLE_SIZE,
        ),
      )
      const newY = Math.max(
        0,
        Math.min(
          dragStartRef.current.posY + deltaY,
          window.innerHeight - BUBBLE_SIZE,
        ),
      )
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      const newX = dragStartRef.current.posX + deltaX
      const newY = dragStartRef.current.posY + deltaY

      const snappedPos = snapToEdge(newX, newY)
      setPosition(snappedPos)
      setDockedSide(calculateDockSide(snappedPos.x, snappedPos.y))
      setIsDragging(false)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - BUBBLE_SIZE - DOCK_OFFSET),
        y: Math.min(prev.y, window.innerHeight - BUBBLE_SIZE - DOCK_OFFSET),
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getDockedTransform = (): { x: number; y: number } => {
    if (!isHovered && !isOpen && !isDragging) {
      switch (dockedSide) {
        case 'left':
          return { x: -BUBBLE_SIZE / 2, y: 0 }
        case 'right':
          return { x: BUBBLE_SIZE / 2, y: 0 }
        case 'top':
          return { x: 0, y: -BUBBLE_SIZE / 2 }
        case 'bottom':
          return { x: 0, y: BUBBLE_SIZE / 2 }
      }
    }
    return { x: 0, y: 0 }
  }

  const handleQuickPrompt = (prompt: string) => {
    setDraftMessage(draftMessage ? `${draftMessage}\n${prompt}` : prompt)
    setIsOpen(false)
  }

  const handleGoHome = () => {
    resetToLobby()
    setIsOpen(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsOpen(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setShowShortcuts(false)
    }
  }, [isOpen])

  const dockedTransform = getDockedTransform()

  const CARD_WIDTH = 288
  const CARD_HEIGHT = 320
  const CARD_GAP = 8

  const getCardPosition = (): React.CSSProperties => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const bubbleX = position.x + dockedTransform.x
    const bubbleY = position.y + dockedTransform.y

    const spaceLeft = bubbleX
    const spaceRight = windowWidth - bubbleX - BUBBLE_SIZE
    const spaceTop = bubbleY
    const spaceBottom = windowHeight - bubbleY - BUBBLE_SIZE

    const canFitRight = spaceRight >= CARD_WIDTH + CARD_GAP
    const canFitLeft = spaceLeft >= CARD_WIDTH + CARD_GAP
    const canFitBottom = spaceBottom >= CARD_HEIGHT + CARD_GAP
    const canFitTop = spaceTop >= CARD_HEIGHT + CARD_GAP

    const base: React.CSSProperties = { position: 'absolute' }

    if (dockedSide === 'left' || (!canFitLeft && canFitRight)) {
      let topOffset = -CARD_HEIGHT / 2 + BUBBLE_SIZE / 2
      const cardTop = bubbleY + topOffset
      const cardBottom = cardTop + CARD_HEIGHT

      if (cardTop < CARD_GAP) {
        topOffset = -bubbleY + CARD_GAP
      } else if (cardBottom > windowHeight - CARD_GAP) {
        topOffset = windowHeight - CARD_GAP - CARD_HEIGHT - bubbleY
      }

      return {
        ...base,
        left: BUBBLE_SIZE + CARD_GAP,
        top: topOffset,
      }
    }

    if (dockedSide === 'right' || (!canFitRight && canFitLeft)) {
      let topOffset = -CARD_HEIGHT / 2 + BUBBLE_SIZE / 2
      const cardTop = bubbleY + topOffset
      const cardBottom = cardTop + CARD_HEIGHT

      if (cardTop < CARD_GAP) {
        topOffset = -bubbleY + CARD_GAP
      } else if (cardBottom > windowHeight - CARD_GAP) {
        topOffset = windowHeight - CARD_GAP - CARD_HEIGHT - bubbleY
      }

      return {
        ...base,
        right: BUBBLE_SIZE + CARD_GAP,
        top: topOffset,
      }
    }

    if (dockedSide === 'top' || (!canFitTop && canFitBottom)) {
      let leftOffset = -CARD_WIDTH / 2 + BUBBLE_SIZE / 2
      const cardLeft = bubbleX + leftOffset
      const cardRight = cardLeft + CARD_WIDTH

      if (cardLeft < CARD_GAP) {
        leftOffset = -bubbleX + CARD_GAP
      } else if (cardRight > windowWidth - CARD_GAP) {
        leftOffset = windowWidth - CARD_GAP - CARD_WIDTH - bubbleX
      }

      return {
        ...base,
        top: BUBBLE_SIZE + CARD_GAP,
        left: leftOffset,
      }
    }

    if (dockedSide === 'bottom' || (!canFitBottom && canFitTop)) {
      let leftOffset = -CARD_WIDTH / 2 + BUBBLE_SIZE / 2
      const cardLeft = bubbleX + leftOffset
      const cardRight = cardLeft + CARD_WIDTH

      if (cardLeft < CARD_GAP) {
        leftOffset = -bubbleX + CARD_GAP
      } else if (cardRight > windowWidth - CARD_GAP) {
        leftOffset = windowWidth - CARD_GAP - CARD_WIDTH - bubbleX
      }

      return {
        ...base,
        bottom: BUBBLE_SIZE + CARD_GAP,
        left: leftOffset,
      }
    }

    let leftOffset = BUBBLE_SIZE / 2 - CARD_WIDTH
    const cardLeft = bubbleX + leftOffset
    if (cardLeft < CARD_GAP) {
      leftOffset = -bubbleX + CARD_GAP
    }

    return {
      ...base,
      bottom: BUBBLE_SIZE + CARD_GAP,
      left: leftOffset,
    }
  }

  return (
    <motion.div
      ref={containerRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
      animate={{
        x: dockedTransform.x,
        y: dockedTransform.y,
      }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 400,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            style={getCardPosition()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Card className="w-72 p-3 shadow-xl border-border/50 bg-card/95 backdrop-blur-xl">
              {showShortcuts ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      键盘快捷键
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowShortcuts(false)}
                    >
                      返回
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { keys: ['⌘/Ctrl', 'K'], desc: '打开/关闭快捷面板' },
                      { keys: ['Enter'], desc: '发送消息' },
                      { keys: ['Shift', 'Enter'], desc: '换行' },
                      { keys: ['Esc'], desc: '关闭面板' },
                    ].map((shortcut) => (
                      <div
                        key={shortcut.desc}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-muted-foreground">
                          {shortcut.desc}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key) => (
                            <kbd
                              key={key}
                              className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(sessionId || hasModeSelected) && (
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            sessionType === 'testcase' ? 'teal' : 'success'
                          }
                          size="sm"
                          className="gap-1"
                        >
                          <ModeIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      {sessionId && (
                        <span className="text-[10px] text-muted-foreground">
                          ID: {sessionId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  )}

                  {(sessionId || hasModeSelected) && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-xs"
                        onClick={handleGoHome}
                      >
                        <Home className="h-3.5 w-3.5" />
                        返回大厅
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-xs"
                        onClick={scrollToTop}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                        回到顶部
                      </Button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      快捷输入
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickPrompts.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleQuickPrompt(item.prompt)}
                          className="px-2 py-1.5 text-xs text-left rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <button
                      onClick={() => setShowShortcuts(true)}
                      className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Keyboard className="h-3.5 w-3.5" />
                        键盘快捷键
                      </div>
                      <div className="flex items-center gap-1">
                        <Command className="h-3 w-3" />
                        <span>K</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: isDragging ? 1 : 0.95 }}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <Button
          size="icon"
          onClick={() => !isDragging && setIsOpen(!isOpen)}
          aria-label={isOpen ? '关闭快捷操作面板' : '打开快捷操作面板'}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
            'bg-linear-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
            isDragging && 'cursor-grabbing',
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <FlaskConical className="h-6 w-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {!isOpen && !isDragging && (isHovered || dockedSide === 'none') && (
        <motion.div
          className="absolute -top-1 -right-1 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <kbd className="px-1 py-0.5 text-[9px] bg-background/90 border border-border rounded shadow-sm text-muted-foreground">
            ⌘K
          </kbd>
        </motion.div>
      )}
    </motion.div>
  )
}
