'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useChatMessages } from '../stores/useChatMessages'
import { useSession } from '../stores/useSession'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Trash2, Edit2, Plus, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const { sessionId, setSessionId, createNewSession, renameId, renameValue, setRenameValue, openRenameModal, closeRenameModal } = useSession()
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
    <aside className='w-64 backdrop-blur-xl bg-slate-950/60 border-r border-white/10 h-full flex flex-col shadow-2xl shadow-purple-500/5'>
      {/* Header */}
      <div className='p-4 border-b border-white/10 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='h-5 w-5 text-purple-400' />
          <span className='text-white font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
            历史会话
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleNew}
          disabled={createMutation.isPending}
          className={cn(
            'bg-gradient-to-r from-purple-500 to-pink-500',
            'hover:from-purple-600 hover:to-pink-600',
            'shadow-lg shadow-purple-500/30',
            'text-white h-8 px-3'
          )}
        >
          <Plus className='h-4 w-4 mr-1' />
          新建
        </Button>
      </div>

      {/* Session List */}
      <ScrollArea className='flex-1'>
        {sessions.length === 0 ? (
          <div className='text-purple-300/50 p-4 text-center text-sm'>
            暂无历史会话
          </div>
        ) : (
          <ul>
            {sessions.map(session => (
              <li key={session.id} className='group relative'>
                <Button
                  variant="ghost"
                  onClick={() => handleSelect(session.id)}
                  disabled={session.id === sessionId}
                  className={cn(
                    'w-full justify-start text-left px-4 py-3 h-auto',
                    'hover:bg-white/5 transition-all duration-200',
                    'rounded-none border-b border-white/5',
                    session.id === sessionId
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white font-semibold border-l-2 border-l-purple-400'
                      : 'text-purple-200/80 hover:text-white'
                  )}
                >
                  <span className='truncate flex-1'>{getSessionTitle(session)}</span>
                </Button>
                
                {/* Action buttons - shown on hover */}
                <div className='absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={e => {
                      e.stopPropagation()
                      openRenameModal(session.id, session.name)
                    }}
                    className='h-7 w-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                  >
                    <Edit2 className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(session.id)
                    }}
                    disabled={deleteMutation.isPending}
                    className='h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10'
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
        <DialogContent className='backdrop-blur-xl bg-slate-950/90 border-white/20 text-white shadow-2xl shadow-purple-500/20'>
          <DialogHeader>
            <DialogTitle className='bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
              重命名会话
            </DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            placeholder='输入新名称'
            className='bg-white/5 border-white/20 text-white placeholder:text-purple-300/50'
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRenameModal}
              className='border-white/20 text-white hover:bg-white/10'
            >
              取消
            </Button>
            <Button
              onClick={() => renameId && handleRename(renameId)}
              disabled={renameMutation.isPending || !renameValue.trim()}
              className={cn(
                'bg-gradient-to-r from-purple-500 to-pink-500',
                'hover:from-purple-600 hover:to-pink-600',
                'shadow-lg shadow-purple-500/30'
              )}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
