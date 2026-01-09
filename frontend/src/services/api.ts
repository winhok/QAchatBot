import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { toast } from 'sonner'
import type { z } from 'zod'
import {
  type CreateSessionResponse,
  CreateSessionResponseSchema,
  type DeleteSessionResponse,
  DeleteSessionResponseSchema,
  type GetSessionsResponse,
  GetSessionsResponseSchema,
  type Session,
  type UpdateSessionResponse,
  UpdateSessionResponseSchema,
} from '@/schemas'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// 类型安全的 API 请求封装 (Zod 运行时校验)
// ============================================================================

interface ApiRequestOptions<T> extends Omit<AxiosRequestConfig, 'url'> {
  /** 用于响应验证的 Zod Schema */
  schema?: z.ZodType<T>
  /** 是否在验证失败时静默处理（不弹 toast） */
  silent?: boolean
}

interface ApiResult<T> {
  data: T
  raw: AxiosResponse<unknown>
}

/**
 * 类型安全的 GET 请求
 * @param url 请求路径
 * @param options 请求选项，包含可选的 Zod Schema 用于响应验证
 * @returns 经过类型校验的响应数据
 */
export async function apiGet<T>(
  url: string,
  options: ApiRequestOptions<T> = {},
): Promise<ApiResult<T>> {
  const { schema, silent, ...config } = options
  const response = await api.get(url, config)
  return validateResponse(response, schema, silent)
}

/**
 * 类型安全的 POST 请求
 */
export async function apiPost<T>(
  url: string,
  data?: unknown,
  options: ApiRequestOptions<T> = {},
): Promise<ApiResult<T>> {
  const { schema, silent, ...config } = options
  const response = await api.post(url, data, config)
  return validateResponse(response, schema, silent)
}

/**
 * 类型安全的 PATCH 请求
 */
export async function apiPatch<T>(
  url: string,
  data?: unknown,
  options: ApiRequestOptions<T> = {},
): Promise<ApiResult<T>> {
  const { schema, silent, ...config } = options
  const response = await api.patch(url, data, config)
  return validateResponse(response, schema, silent)
}

/**
 * 类型安全的 DELETE 请求
 */
export async function apiDelete<T>(
  url: string,
  options: ApiRequestOptions<T> = {},
): Promise<ApiResult<T>> {
  const { schema, silent, ...config } = options
  const response = await api.delete(url, config)
  return validateResponse(response, schema, silent)
}

/**
 * 验证响应数据
 * 使用 Zod safeParse 进行运行时校验，确保前后端数据结构一致
 */
function validateResponse<T>(
  response: AxiosResponse<unknown>,
  schema?: z.ZodType<T>,
  silent?: boolean,
): ApiResult<T> {
  if (!schema) {
    return { data: response.data as T, raw: response }
  }

  const result = schema.safeParse(response.data)

  if (!result.success) {
    const errorMessage = `API 响应格式错误: ${result.error.issues.map((i) => i.message).join(', ')}`

    if (!silent) {
      toast.error('数据格式异常', {
        description: import.meta.env.DEV ? errorMessage : '请刷新页面重试',
      })
    }

    if (import.meta.env.DEV) {
      console.error('[API Schema Validation Error]', {
        url: response.config.url,
        issues: result.error.issues,
        received: response.data,
      })
    }

    throw new ApiValidationError(errorMessage, result.error.issues, response)
  }

  return { data: result.data, raw: response }
}

/**
 * API 验证错误类
 */
export class ApiValidationError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[],
    public response: AxiosResponse<unknown>,
  ) {
    super(message)
    this.name = 'ApiValidationError'
  }
}

// ============================================================================
// Chat Service (使用类型安全的 API 方法)
// ============================================================================

export const chatService = {
  /**
   * Send a message and stream the response
   */
  async *streamMessage(
    message: string,
    sessionId: string | null = null,
    modelId: string | null = null,
    sessionType = 'normal',
  ) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          model_id: modelId,
          session_type: sessionType,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          try {
            const event = JSON.parse(line)
            yield event
          } catch (e) {
            console.error('Failed to parse event:', line, e)
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
      throw error
    }
  },

  /**
   * Check if the API is healthy
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      console.error('Error checking health:', error)
      throw error
    }
  },

  /**
   * Get all sessions (with Zod validation)
   */
  getSessions: async (): Promise<Session[]> => {
    const { data } = await apiGet<GetSessionsResponse>('/api/sessions', {
      schema: GetSessionsResponseSchema,
    })
    return data.sessions
  },

  /**
   * Create a new session (with Zod validation)
   */
  createSession: async (
    name: string | null = null,
    type = 'normal',
  ): Promise<CreateSessionResponse> => {
    const { data } = await apiPost<CreateSessionResponse>(
      '/api/sessions',
      { name, type },
      { schema: CreateSessionResponseSchema },
    )
    return data
  },

  /**
   * Update session name (with Zod validation)
   */
  updateSession: async (sessionId: string, name: string): Promise<UpdateSessionResponse> => {
    const { data } = await apiPatch<UpdateSessionResponse>(
      `/api/sessions/${sessionId}`,
      { name },
      { schema: UpdateSessionResponseSchema },
    )
    return data
  },

  /**
   * Delete a session (with Zod validation)
   */
  deleteSession: async (sessionId: string): Promise<DeleteSessionResponse> => {
    const { data } = await apiDelete<DeleteSessionResponse>(`/api/sessions/${sessionId}`, {
      schema: DeleteSessionResponseSchema,
    })
    return data
  },
}

export default api
