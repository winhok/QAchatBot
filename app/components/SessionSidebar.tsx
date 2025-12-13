'use client'

import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { cn } from '@/app/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit2, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useCallback } from 'react'
import { useChatMessages } from '../stores/useChatMessages'
import { useSession } from '../stores/useSession'

interface Session {
  id: string
  name: string
  created_at: string
}

function getSessionTitle(session: Session) {
  return session.name || `会话 ${session.id.slice(0, 8)}`
}

async function fetchSessions(): Promise<Session[]> {
  const res = await fetch('/api/chat/sessions')
  const data = await res.json()
  return Array.isArray(data.sessions) ? data.sessions : []
}

async function createSession(name: string): Promise<{ id: string }> {
  const res = await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return res.json()
}

async function deleteSession(id: string): Promise<void> {
  await fetch('/api/chat/sessions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}

async function renameSession(id: string, name: string): Promise<void> {
  await fetch('/api/chat/sessions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name }),
  })
}

export default function SessionSidebar() {
  const {
    sessionId,
    setSessionId,
    createNewSession,
    renameId,
    renameValue,
    setRenameValue,
    openRenameModal,
    closeRenameModal,
  } = useSession()
  const resetMessages = useChatMessages(s => s.resetMessages)
  const queryClient = useQueryClient()

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createSession(name),
    onSuccess: data => {
      if (data.id) {
        createNewSession(data.id)
        resetMessages()
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameSession(id, name),
    onSuccess: () => {
      closeRenameModal()
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const handleNew = () => createMutation.mutate('')

  const handleSelect = (id: string) => {
    if (id !== sessionId) {
      setSessionId(id)
    }
  }

  const handleDelete = (id: string) => deleteMutation.mutate(id)

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return
    renameMutation.mutate({ id, name: renameValue.trim() })
  }

  return (
    <aside className='w-64 border-r border-border/50 bg-sidebar h-full flex flex-col'>
      {/* Logo Header */}
      <div className='flex items-center gap-3 p-4 pb-2'>
        <div className='relative'>
          <div className='absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 blur-lg opacity-50' />
          <div className='relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg'>
            <MessageSquare className='h-5 w-5 text-white' />
          </div>
        </div>
        <div>
          <h2 className='text-lg font-bold text-sidebar-foreground'>QA ChatBot</h2>
          <p className='text-xs text-muted-foreground'>智能测试助手</p>
        </div>
      </div>
      
      {/* New Chat Button */}
      <div className='px-4 pb-4'>
        <Button
          onClick={handleNew}
          disabled={createMutation.isPending}
          className='w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground'
        >
          <Plus className='h-4 w-4 mr-2' />
          新建会话
        </Button>
      </div>
      
      {/* Sessions Header */}
      <div className='px-4 py-2 border-b border-border/50'>
        <span className='text-sm font-medium text-sidebar-foreground'>历史会话</span>
      </div>

      {/* Session List */}
      <ScrollArea className='flex-1'>
        {sessions.length === 0 ? (
          <div className='text-muted-foreground p-4 text-center text-sm'>暂无历史会话</div>
        ) : (
          <ul>
            {sessions.map(session => (
              <li key={session.id} className='group relative'>
                <Button
                  variant='ghost'
                  onClick={() => handleSelect(session.id)}
                  disabled={session.id === sessionId}
                  className={cn(
                    'w-full justify-start text-left px-4 py-3 h-auto',
                    'hover:bg-sidebar-accent transition-all duration-200',
                    'rounded-none border-b border-sidebar-border',
                    session.id === sessionId
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-l-sidebar-primary'
                      : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
                  )}
                >
                  <span className='truncate flex-1'>{getSessionTitle(session)}</span>
                </Button>

                {/* Action buttons - shown on hover */}
                <div className='absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={e => {
                      e.stopPropagation()
                      openRenameModal(session.id, session.name)
                    }}
                    className='h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                  >
                    <Edit2 className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(session.id)
                    }}
                    disabled={deleteMutation.isPending}
                    className='h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={!!renameId} onOpenChange={closeRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名会话</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            placeholder='输入新名称'
            autoFocus
          />
          <DialogFooter>
            <Button variant='outline' onClick={closeRenameModal}>
              取消
            </Button>
            <Button onClick={() => renameId && handleRename(renameId)} disabled={renameMutation.isPending || !renameValue.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
