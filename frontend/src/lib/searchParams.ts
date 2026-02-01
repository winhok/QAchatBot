import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useRef } from 'react'

/**
 * Search params schema for chat routes
 * Can be extended with more params like `hideToolCalls`, `debug`, etc.
 */
export interface ChatSearchParams {
  hideToolCalls?: boolean
}

/**
 * Validate and parse search params for chat routes
 * Ensures type safety without runtime type assertions
 */
export function validateChatSearch(search: Record<string, unknown>): ChatSearchParams {
  return {
    hideToolCalls: search.hideToolCalls === true || search.hideToolCalls === 'true',
  }
}

/**
 * Hook to read and update search params using Tanstack Router
 * Provides type-safe access to URL query parameters
 * Note: Routes must define validateSearch for type safety
 */
export function useChatSearchParams() {
  const navigate = useNavigate()
  // Search params are validated by route's validateSearch function
  // Using strict: false allows this hook to work across all routes
  const search = useSearch({ strict: false })

  // Use ref to avoid callback dependency on search value (rerender-functional-setstate pattern)
  const searchRef = useRef(search)
  searchRef.current = search

  const setSearchParams = useCallback(
    (updates: Partial<ChatSearchParams>) => {
      void navigate({
        to: '.',
        search: updates,
        replace: true,
      })
    },
    [navigate],
  )

  // Stable callback that reads current value from ref
  const toggleHideToolCalls = useCallback(() => {
    setSearchParams({ hideToolCalls: !searchRef.current.hideToolCalls })
  }, [setSearchParams])

  return {
    hideToolCalls: search.hideToolCalls ?? false,
    toggleHideToolCalls,
    setSearchParams,
  }
}

/**
 * Navigate to a thread with optional search params
 */
export function useNavigateToThread() {
  const navigate = useNavigate()

  return useCallback(
    (threadId: string, searchParams?: ChatSearchParams) => {
      void navigate({
        to: '/$threadId',
        params: { threadId },
        search: searchParams,
      })
    },
    [navigate],
  )
}
