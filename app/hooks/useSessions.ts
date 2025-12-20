'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session, SessionType } from '@/app/types/stores'

// API 函数
async function fetchSessions(): Promise<Session[]> {
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
  await fetch('/api/sessions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}

async function renameSession(id: string, name: string, type?: SessionType): Promise<void> {
  await fetch('/api/sessions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, type }),
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

export function useInvalidateSessions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
}
