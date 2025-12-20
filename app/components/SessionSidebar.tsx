'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { useQuickAction } from '@/app/hooks/useQuickAction'
import { useDeleteSession, useRenameSession, useSessions } from '@/app/hooks/useSessions'
import { cn } from '@/app/lib/utils'
import { useChatMessages } from '@/app/stores/useChatMessages'
import { useSession } from '@/app/stores/useSession'
import type { Session, SessionType } from '@/app/types/stores'
import { Bug, ChevronRight, FileCode, FlaskConical, MessageSquare, MoreHorizontal, Pencil, Plus, Search, TestTube2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function getSessionTitle(session: Session) {
  return session.name || `会话 ${session.id.slice(0, 8)}`
}

const quickActions = [
  {
    id: 'normal',
    icon: MessageSquare,
    label: '普通聊天',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    implemented: true,
  },
  {
    id: 'testcase',
    icon: TestTube2,
    label: '测试设计',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    implemented: true,
  },
  {
    id: 'api-test',
    icon: FileCode,
    label: '接口测试',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    implemented: false,
  },
  {
    id: 'bug-analysis',
    icon: Bug,
    label: 'Bug分析',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    implemented: false,
  },
]

export default function SessionSidebar() {
  const router = useRouter()
  const { startNewSession } = useQuickAction()

  const { sessionId, setSessionId, renameId, renameValue, setRenameValue, openRenameModal, closeRenameModal } = useSession()
  const resetMessages = useChatMessages(s => s.resetMessages)

  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 使用新的 hooks
  const { data: sessions = [] } = useSessions()
  const deleteMutation = useDeleteSession()
  const renameMutation = useRenameSession()

  const filteredSessions = sessions.filter(session => getSessionTitle(session).toLowerCase().includes(searchQuery.toLowerCase()))

  const handleNew = () => {
    startNewSession('normal')
  }

  const handleSelect = (id: string) => {
    if (id !== sessionId) {
      setSessionId(id)
      router.push(`/${id}`)
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (id === sessionId) {
          setSessionId('')
          resetMessages()
          if (window.location.pathname !== '/') {
            router.push('/')
          }
        }
      },
    })
  }

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return
    renameMutation.mutate(
      { id, name: renameValue.trim() },
      { onSuccess: closeRenameModal }
    )
  }

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    if (!action.implemented) {
      router.push('/not-found')
      return
    }
    startNewSession(action.id as SessionType)
  }

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'testcase':
        return <TestTube2 className='h-4 w-4 text-teal-400' />
      case 'normal':
      default:
        return <MessageSquare className='h-4 w-4 text-emerald-400' />
    }
  }

  return (
    <aside className='w-64 border-r border-border/50 bg-sidebar h-full flex flex-col'>
      <div className='flex items-center gap-3 p-4 pb-2'>
        <div className='relative'>
          <div className='absolute inset-0 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 blur-lg opacity-50' />
          <div className='relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg'>
            <FlaskConical className='h-5 w-5 text-white' />
          </div>
        </div>
        <div>
          <h1 className='text-lg font-bold text-sidebar-foreground'>
            QA<span className='text-emerald-400'>Bot</span>
          </h1>
          <p className='text-xs text-muted-foreground'>智能测试助手</p>
        </div>
      </div>

      <div className='px-3 py-2'>
        <div className='flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-muted-foreground'>
          <Search className='h-4 w-4' />
          <input
            type='text'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='搜索会话...'
            className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
        </div>
      </div>

      <div className='px-3 py-2'>
        <Button
          onClick={handleNew}
          className='w-full justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]'
        >
          <Plus className='h-4 w-4' />
          新建会话
        </Button>
      </div>

      <div className='px-3 py-2'>
        <div className='grid grid-cols-4 gap-1.5'>
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg p-2 transition-all hover:scale-105 relative',
                action.bg,
                'hover:opacity-80',
                !action.implemented && 'opacity-60'
              )}
            >
              <action.icon className={cn('h-4 w-4', action.color)} />
              <span className='text-[10px] text-muted-foreground'>{action.label}</span>
              {!action.implemented && <span className='absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500' />}
            </button>
          ))}
        </div>
      </div>

      <div className='flex-1 px-3 py-2'>
        <div className='flex items-center justify-between px-2 mb-2'>
          <span className='text-xs font-medium text-muted-foreground'>历史会话</span>
          <ChevronRight className='h-3 w-3 text-muted-foreground' />
        </div>
        <ScrollArea className='h-[calc(100vh-340px)]'>
          <div className='space-y-1'>
            {filteredSessions.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground text-sm'>{searchQuery ? '未找到匹配的会话' : '暂无会话记录'}</div>
            ) : (
              filteredSessions.map(session => (
                <div key={session.id} className='relative' onMouseEnter={() => setHoveredId(session.id)} onMouseLeave={() => setHoveredId(null)}>
                  <button
                    onClick={() => handleSelect(session.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all',
                      sessionId === session.id
                        ? 'bg-linear-to-r from-emerald-600/20 to-teal-600/10 text-sidebar-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    {getTypeIcon(session.type)}
                    <span className='truncate flex-1 text-left'>{getSessionTitle(session)}</span>
                  </button>

                  {(hoveredId === session.id || openMenuId === session.id) && (
                    <DropdownMenu open={openMenuId === session.id} onOpenChange={(open) => setOpenMenuId(open ? session.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <button className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'>
                          <MoreHorizontal className='h-4 w-4' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-32'>
                        <DropdownMenuItem onClick={() => openRenameModal(session.id, session.name)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem className='text-destructive' onClick={() => handleDelete(session.id)}>
                          <Trash2 className='mr-2 h-4 w-4' />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={!!renameId} onOpenChange={closeRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名会话</DialogTitle>
            <DialogDescription>为当前会话设置一个新名称</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            placeholder='请输入新名称'
            onKeyDown={e => e.key === 'Enter' && renameId && handleRename(renameId)}
            autoFocus
          />
          <DialogFooter>
            <Button variant='outline' onClick={closeRenameModal}>
              取消
            </Button>
            <Button onClick={() => renameId && handleRename(renameId)} disabled={renameMutation.isPending || !renameValue.trim()}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
