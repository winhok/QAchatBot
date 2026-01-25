import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { gitService } from '@/services/git'

interface UseMergeBranchesOptions {
  sessionId: string
  checkpointA: string
  checkpointB: string
  modelId?: string
}

export function useMergeBranches() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [newSessionId, setNewSessionId] = useState<string | null>(null)

  const merge = useCallback(async (options: UseMergeBranchesOptions, instruction?: string) => {
    const { sessionId, checkpointA, checkpointB, modelId } = options

    setIsLoading(true)
    setStreamedContent('')
    setError(null)
    setNewSessionId(null)

    try {
      for await (const chunk of gitService.merge(sessionId, checkpointA, checkpointB, {
        modelId,
        instruction,
      })) {
        if (chunk.type === 'chunk' && chunk.content) {
          setStreamedContent((prev) => prev + chunk.content)
        } else if (chunk.type === 'end' && chunk.new_session_id) {
          setNewSessionId(chunk.new_session_id)
        } else if (chunk.type === 'error') {
          setError(chunk.error || 'Unknown error')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const navigateToNewSession = useCallback(() => {
    if (newSessionId) {
      navigate({ to: '/$threadId', params: { threadId: newSessionId } })
    }
  }, [navigate, newSessionId])

  const reset = useCallback(() => {
    setStreamedContent('')
    setError(null)
    setNewSessionId(null)
  }, [])

  return {
    merge,
    isLoading,
    streamedContent,
    error,
    newSessionId,
    navigateToNewSession,
    reset,
  }
}
