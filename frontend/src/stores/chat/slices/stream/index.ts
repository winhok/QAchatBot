import type { StateCreator } from 'zustand'
import type { ChatStore } from '../../store'

/**
 * Stream slice 初始状态
 */
export interface StreamState {
  isLoading: boolean
  isStreaming: boolean
  abortController: AbortController | null
  streamingMessageId: string | null
}

export const initialStreamState: StreamState = {
  isLoading: false,
  isStreaming: false,
  abortController: null,
  streamingMessageId: null,
}

/**
 * Stream slice actions 接口
 */
export interface StreamAction {
  setIsLoading: (loading: boolean) => void
  setIsStreaming: (streaming: boolean) => void
  setAbortController: (controller: AbortController | null) => void
  setStreamingMessageId: (id: string | null) => void
  abortStreaming: () => void
}

/**
 * Stream slice 实现
 */
export const streamSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  StreamAction
> = (set, get) => ({
  setIsLoading: (loading) => {
    set({ isLoading: loading }, false, 'stream/setIsLoading')
  },

  setIsStreaming: (streaming) => {
    set({ isStreaming: streaming }, false, 'stream/setIsStreaming')
  },

  setAbortController: (controller) => {
    set({ abortController: controller }, false, 'stream/setAbortController')
  },

  setStreamingMessageId: (id) => {
    set({ streamingMessageId: id }, false, 'stream/setStreamingMessageId')
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
      },
      false,
      'stream/abortStreaming',
    )
  },
})
