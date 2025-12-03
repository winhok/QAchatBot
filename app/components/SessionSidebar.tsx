'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

const TrashIcon = () => (
  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14'
    />
  </svg>
)

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
    <aside className='w-64 bg-slate-900 border-r border-white/10 h-full flex flex-col'>
      <div className='p-4 border-b border-white/10 flex items-center justify-between'>
        <span className='text-white font-bold text-lg'>历史会话</span>
        <button
          className='px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs disabled:opacity-50'
          onClick={handleNew}
          disabled={createMutation.isPending}
        >
          新建会话
        </button>
      </div>
      <div className='flex-1 overflow-y-auto custom-scrollbar'>
        {sessions.length === 0 ? (
          <div className='text-purple-200 p-4'>暂无历史会话</div>
        ) : (
          <ul>
            {sessions.map(session => (
              <li key={session.id} className='group flex items-center'>
                <button
                  className={`flex-1 text-left px-4 py-3 hover:bg-purple-800 transition-colors flex items-center gap-2 ${
                    session.id === sessionId ? 'bg-purple-700 text-white font-bold' : 'text-purple-200'
                  }`}
                  onClick={() => handleSelect(session.id)}
                  disabled={session.id === sessionId}
                >
                  <span className='truncate'>{getSessionTitle(session)}</span>
                </button>
                <button
                  className='ml-1 text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:underline disabled:opacity-50'
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(session.id)
                  }}
                  title='删除'
                  disabled={deleteMutation.isPending}
                >
                  <TrashIcon />
                </button>
                <button
                  className='ml-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 hover:underline'
                  onClick={e => {
                    e.stopPropagation()
                    openRenameModal(session.id, session.name)
                  }}
                  title='重命名'
                >
                  ✏️
                </button>
              </li>
            ))}
          </ul>
        )}
        {renameId && (
          <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 shadow-xl w-80'>
              <h2 className='text-lg font-bold mb-2'>重命名会话</h2>
              <input className='border px-2 py-1 w-full mb-4' value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus />
              <div className='flex justify-end gap-2'>
                <button className='px-3 py-1 bg-gray-200 rounded' onClick={closeRenameModal}>
                  取消
                </button>
                <button
                  className='px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50'
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
