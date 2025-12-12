'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
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
  const { sessionId, setSessionId, createNewSession, renameId, renameValue, setRenameValue, openRenameModal, closeRenameModal } = useSession()
  const resetMessages = useChatMessages(s => s.resetMessages)
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

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

  // Simple frontend filtering
  const filteredSessions = sessions.filter(session =>
    getSessionTitle(session).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className='w-64 bg-slate-900/95 backdrop-blur-md border-r border-white/10 h-full flex flex-col shadow-xl'>
      <div className='p-4 border-b border-white/10 flex items-center justify-between'>
        <span className='text-white font-bold text-lg'>历史会话</span>
        <button
          className='p-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:transform-none'
          onClick={handleNew}
          disabled={createMutation.isPending}
          aria-label='新建会话'
          title='新建会话'
        >
          <Plus className='h-4 w-4' />
        </button>
      </div>

      {/* Search Box */}
      <div className='p-3 border-b border-white/10'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300' />
          <input
            type='text'
            placeholder='搜索会话...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white text-sm placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200'
          />
        </div>
      </div>

      <div className='flex-1 overflow-y-auto custom-scrollbar'>
        {filteredSessions.length === 0 ? (
          <div className='text-purple-200 p-4 text-sm text-center'>{searchQuery ? '未找到匹配的会话' : '暂无历史会话'}</div>
        ) : (
          <ul>
            {filteredSessions.map(session => (
              <li key={session.id} className='group relative'>
                <button
                  className={`w-full text-left px-4 py-3 hover:bg-purple-800/50 transition-all duration-200 flex items-center gap-2 ${
                    session.id === sessionId ? 'bg-purple-700/70 text-white font-semibold' : 'text-purple-200'
                  }`}
                  onClick={() => handleSelect(session.id)}
                  disabled={session.id === sessionId}
                >
                  <span className='truncate flex-1'>{getSessionTitle(session)}</span>
                </button>
                <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                  <button
                    className='p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition-all duration-200 touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center'
                    onClick={e => {
                      e.stopPropagation()
                      openRenameModal(session.id, session.name)
                    }}
                    title='重命名'
                    aria-label='重命名会话'
                  >
                    <Edit2 className='h-3.5 w-3.5' />
                  </button>
                  <button
                    className='p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded disabled:opacity-50 transition-all duration-200 touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center'
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(session.id)
                    }}
                    title='删除'
                    aria-label='删除会话'
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {renameId && (
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-slate-800 border border-white/20 rounded-2xl p-6 shadow-2xl w-full max-w-md'>
              <h2 className='text-lg font-bold mb-4 text-white'>重命名会话</h2>
              <input
                className='w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 mb-4'
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                placeholder='输入新名称'
                autoFocus
              />
              <div className='flex justify-end gap-2'>
                <button
                  className='px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-200'
                  onClick={closeRenameModal}
                >
                  取消
                </button>
                <button
                  className='px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg'
                  onClick={() => handleRename(renameId)}
                  disabled={renameMutation.isPending}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
