import { rankItem } from '@tanstack/match-sorter-utils'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight,
  FlaskConical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  TestTube2,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { Session } from '@/types/stores'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserSection } from '@/components/UserSection'
import { useQuickAction } from '@/hooks/useQuickAction'
import { useDeleteSession, useRenameSession, useSessions } from '@/hooks/useSessions'
import { listItemVariants, staggerFastContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useSession } from '@/stores/useSession'

function getSessionTitle(session: Session) {
  return session.name || `会话::${session.id.slice(0, 8).toUpperCase()}`
}

export default function SessionSidebar() {
  const navigate = useNavigate()
  const { resetToLobby } = useQuickAction()

  const sessionId = useSession((s) => s.sessionId)
  const setSessionId = useSession((s) => s.setSessionId)
  const renameId = useSession((s) => s.renameId)
  const renameValue = useSession((s) => s.renameValue)
  const setRenameValue = useSession((s) => s.setRenameValue)
  const openRenameModal = useSession((s) => s.openRenameModal)
  const closeRenameModal = useSession((s) => s.closeRenameModal)

  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 使用新的 hooks
  const { data: sessions = [] } = useSessions()
  const deleteMutation = useDeleteSession()
  const renameMutation = useRenameSession()

  // 使用 match-sorter-utils 实现模糊搜索和智能排序
  const filteredSessions = (() => {
    if (!searchQuery.trim()) return sessions

    return sessions
      .map((session) => {
        const title = getSessionTitle(session)
        const ranking = rankItem(title, searchQuery, { threshold: 2 })
        return { session, ranking }
      })
      .filter(({ ranking }) => ranking.passed)
      .sort((a, b) => b.ranking.rank - a.ranking.rank)
      .map(({ session }) => session)
  })()

  const handleNew = () => {
    resetToLobby()
  }

  const handleSelect = (id: string) => {
    setSessionId(id)
    navigate({ to: '/$threadId', params: { threadId: id } })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (id === sessionId) {
          resetToLobby()
        }
      },
    })
  }

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return
    renameMutation.mutate({ id, name: renameValue.trim() }, { onSuccess: closeRenameModal })
  }

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'testcase':
        return <TestTube2 className="h-4 w-4 text-primary" />
      case 'normal':
      default:
        return <MessageSquare className="h-4 w-4 text-primary" />
    }
  }

  return (
    <aside className="w-64 border-r border-border/50 bg-sidebar/95 backdrop-blur-md h-full flex flex-col font-mono">
      {/* Header Area */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="relative group">
          <div className="absolute inset-0 rounded-sm bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 border border-primary/20 text-primary">
            <FlaskConical className="h-5 w-5" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tighter">
            QA<span className="text-primary">BOT</span>_v1
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">系统在线</p>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-sm bg-sidebar-accent/50 border border-transparent focus-within:border-primary/50 px-3 py-2 text-muted-foreground transition-colors">
          <Search className="h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记录..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 font-mono"
          />
        </div>
      </div>

      <div className="px-3 py-2">
        <Button
          onClick={handleNew}
          className="w-full justify-center gap-2 rounded-sm bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          新建会话
        </Button>
      </div>

      <div className="flex-1 px-3 py-2 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            历史索引
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>
        <ScrollArea className="flex-1 scrollbar-thin">
          <motion.div
            variants={staggerFastContainer}
            initial="hidden"
            animate="visible"
            className="space-y-0.5"
          >
            <AnimatePresence mode="popLayout">
              {filteredSessions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground/40 text-xs"
                >
                  {searchQuery ? '[ 无匹配项 ]' : '[ 空记录 ]'}
                </motion.div>
              ) : (
                filteredSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="relative"
                    onMouseEnter={() => setHoveredId(session.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <motion.button
                      onClick={() => handleSelect(session.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-xs transition-all border-l-2',
                        sessionId === session.id
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                      )}
                    >
                      {getTypeIcon(session.type)}
                      <span className="truncate flex-1 text-left tracking-tight">
                        {getSessionTitle(session)}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {(hoveredId === session.id || openMenuId === session.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <DropdownMenu
                            open={openMenuId === session.id}
                            onOpenChange={(open) => setOpenMenuId(open ? session.id : null)}
                          >
                            <DropdownMenuTrigger asChild>
                              <button className="rounded-sm p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-primary transition-colors">
                                <MoreHorizontal className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 font-mono">
                              <DropdownMenuItem
                                onClick={() =>
                                  openRenameModal(session.id, getSessionTitle(session))
                                }
                              >
                                <Pencil className="mr-2 h-3 w-3" />
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(session.id)}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </div>

      {/* 用户区域 */}
      <div className="px-3 py-3 border-t border-border/50 mt-auto">
        <UserSection />
      </div>

      <Dialog open={!!renameId} onOpenChange={closeRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名会话 ID</DialogTitle>
            <DialogDescription>输入此会话的新标识符。</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="新名称..."
            className="font-mono"
            onKeyDown={(e) => e.key === 'Enter' && renameId && handleRename(renameId)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeRenameModal}>
              取消
            </Button>
            <Button
              onClick={() => renameId && handleRename(renameId)}
              disabled={renameMutation.isPending || !renameValue.trim()}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
