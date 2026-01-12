import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsQueryKey } from './useSessions'
import { folderService } from '@/services/api'

// Query key
export const foldersQueryKey = ['folders'] as const

// Hooks
export function useFolders() {
  return useQuery({
    queryKey: foldersQueryKey,
    queryFn: folderService.getFolders,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: folderService.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersQueryKey })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      ...params
    }: {
      id: string
      name?: string
      icon?: string
      color?: string
      description?: string
    }) => folderService.updateFolder(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersQueryKey })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: folderService.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersQueryKey })
      // Sessions may have been moved to default folder
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useMoveSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, sessionId }: { folderId: string | null; sessionId: string }) =>
      folderService.moveSessionToFolder(folderId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useMoveSessionsBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, sessionIds }: { folderId: string; sessionIds: Array<string> }) =>
      folderService.moveSessionsToFolder(folderId, sessionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey })
    },
  })
}

export function useInvalidateFolders() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: foldersQueryKey })
}
