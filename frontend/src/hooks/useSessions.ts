import type { Session, SessionType } from '@/types/stores'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// API 函数
async function fetchSessions(): Promise<Array<Session>> {
  const res = await fetch('/api/sessions')
  const data = await res.json()
  return Array.isArray(data.sessions) ? data.sessions : []
}

async function createSession(name: string): Promise<{ id: string }> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return res.json()
}

async function deleteSession(id: string): Promise<void> {
  await fetch(`/api/sessions/${id}`, {
    method: 'DELETE',
  })
}

async function renameSession(id: string, name: string, type?: SessionType): Promise<void> {
  await fetch(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  })
}

// Query key
export const sessionsQueryKey = ['sessions'] as const

// Hooks
export function useSessions() {
  return useQuery({
    queryKey: sessionsQueryKey,
    queryFn: fetchSessions,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useRenameSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name, type }: { id: string; name: string; type?: SessionType }) =>
      renameSession(id, name, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useUpdateSessionName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.slice(0, 20) }),
      })
      if (!res.ok) throw new Error('Failed to update session name')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useInvalidateSessions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
}
