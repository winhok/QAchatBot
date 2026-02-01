import type { StateCreator } from 'zustand'
import type { ChatStore } from '../../store'

export interface StreamMeta {
  runId: string
  threadId: string
}

// Storage key versioning for future schema changes
const STORAGE_VERSION = 'v1'
const STORAGE_KEY_PREFIX = `lg:stream:${STORAGE_VERSION}`

/**
 * Stream slice 初始状态
 */
export interface StreamState {
  isLoading: boolean
  isStreaming: boolean
  streamingMessageId: string | null
  abortController: AbortController | null

  // StreamManager features
  throttleMs: number
  reconnectEnabled: boolean
  lastStreamMeta: StreamMeta | null
}

export const initialStreamState: StreamState = {
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  abortController: null,

  throttleMs: 16,
  reconnectEnabled: true,
  lastStreamMeta: null,
}

/**
 * Stream slice actions 接口
 */
export interface StreamAction {
  setIsLoading: (loading: boolean) => void
  setIsStreaming: (streaming: boolean) => void
  setStreamingMessageId: (id: string | null) => void
  setAbortController: (controller: AbortController | null) => void
  abortStreaming: () => void

  // StreamManager actions
  setThrottle: (ms: number) => void
  setReconnectEnabled: (enabled: boolean) => void
  saveStreamMeta: (meta: StreamMeta) => void
  clearStreamMeta: () => void
  loadStreamMeta: (threadId: string) => StreamMeta | null
}

export interface StreamSlice extends StreamState, StreamAction {}

/**
 * Get storage key for a thread's stream meta
 */
function getStorageKey(threadId: string): string {
  return `${STORAGE_KEY_PREFIX}:${threadId}`
}

/**
 * Clean up stale stream meta entries (older than 24 hours)
 * Called on saveStreamMeta to prevent storage bloat
 */
function cleanupStaleEntries(): void {
  if (typeof sessionStorage === 'undefined') return

  try {
    const keysToRemove: Array<string> = []
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue

      const value = sessionStorage.getItem(key)
      if (!value) continue

      try {
        const parsed = JSON.parse(value)
        if (parsed.timestamp && now - parsed.timestamp > maxAge) {
          keysToRemove.push(key)
        }
      } catch {
        // Invalid JSON, remove it
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      sessionStorage.removeItem(key)
    }
  } catch {
    // Ignore cleanup errors
  }
}

export const streamSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  StreamAction
> = (set, get) => ({
  setIsLoading: (loading) => {
    set({ isLoading: loading }, false, 'stream/setIsLoading')
  },

  setIsStreaming: (streaming) => {
    set({ isStreaming: streaming }, false, 'stream/setIsStreaming')
  },

  setStreamingMessageId: (id) => {
    set({ streamingMessageId: id }, false, 'stream/setStreamingMessageId')
  },

  setAbortController: (controller) => {
    set({ abortController: controller }, false, 'stream/setAbortController')
  },

  abortStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set(
      {
        abortController: null,
        isStreaming: false,
        streamingMessageId: null,
        isLoading: false,
      },
      false,
      'stream/abortStreaming',
    )
  },

  setThrottle: (ms) =>
    set(
      (state) => {
        state.throttleMs = ms
      },
      false,
      'stream/setThrottle',
    ),

  setReconnectEnabled: (enabled) =>
    set(
      (state) => {
        state.reconnectEnabled = enabled
      },
      false,
      'stream/setReconnectEnabled',
    ),

  saveStreamMeta: (meta) => {
    set(
      (state) => {
        state.lastStreamMeta = meta
      },
      false,
      'stream/saveStreamMeta',
    )

    try {
      if (typeof sessionStorage !== 'undefined') {
        // Clean up stale entries periodically
        cleanupStaleEntries()

        // Save with timestamp for cleanup
        const payload = JSON.stringify({
          runId: meta.runId,
          threadId: meta.threadId,
          timestamp: Date.now(),
        })
        sessionStorage.setItem(getStorageKey(meta.threadId), payload)
      }
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  },

  clearStreamMeta: () => {
    const { lastStreamMeta } = get()

    // Remove from storage if exists
    if (lastStreamMeta?.threadId && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(getStorageKey(lastStreamMeta.threadId))
      } catch {
        // Ignore
      }
    }

    set(
      (state) => {
        state.lastStreamMeta = null
      },
      false,
      'stream/clearStreamMeta',
    )
  },

  loadStreamMeta: (threadId) => {
    if (typeof sessionStorage === 'undefined') return null

    try {
      const value = sessionStorage.getItem(getStorageKey(threadId))
      if (!value) return null

      const parsed = JSON.parse(value)
      if (!parsed.runId || !parsed.threadId) return null

      return { runId: parsed.runId, threadId: parsed.threadId }
    } catch {
      return null
    }
  },
})
