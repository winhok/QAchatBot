/**
 * Git API Service - 对话版本控制相关 API
 */

// ============================================================================
// Types
// ============================================================================

export interface TreeNode {
  checkpointId: string
  parentCheckpointId: string | null
  preview: string
  messageCount: number
  createdAt: string
  role: 'user' | 'assistant'
}

export interface TreeResponse {
  nodes: Array<TreeNode>
}

export interface DiffMessage {
  role: string
  content: string
}

export interface DiffBranch {
  checkpointId: string
  messages: Array<DiffMessage>
}

export interface DiffResponse {
  branchA: DiffBranch
  branchB: DiffBranch
  commonAncestor: string | null
}

export interface MergeChunk {
  type: 'chunk' | 'end' | 'error'
  content?: string
  new_session_id?: string
  error?: string
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * 获取对话树结构
 */
async function getTree(sessionId: string, modelId?: string): Promise<TreeResponse> {
  const params = new URLSearchParams()
  if (modelId) params.set('model_id', modelId)

  const url = `/api/chat/${sessionId}/tree${params.toString() ? `?${params}` : ''}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch tree: ${res.status}`)
  }

  return res.json()
}

/**
 * 对比两个分支的差异
 */
async function getDiff(
  sessionId: string,
  checkpointA: string,
  checkpointB: string,
  modelId?: string,
): Promise<DiffResponse> {
  const params = new URLSearchParams({
    checkpoint_a: checkpointA,
    checkpoint_b: checkpointB,
  })
  if (modelId) params.set('model_id', modelId)

  const url = `/api/chat/${sessionId}/diff?${params}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch diff: ${res.status}`)
  }

  return res.json()
}

/**
 * 合并两个分支（流式响应）
 */
async function* merge(
  sessionId: string,
  checkpointA: string,
  checkpointB: string,
  options?: { modelId?: string; instruction?: string },
): AsyncGenerator<MergeChunk> {
  const res = await fetch(`/api/chat/${sessionId}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkpoint_a: checkpointA,
      checkpoint_b: checkpointB,
      model_id: options?.modelId,
      instruction: options?.instruction,
    }),
  })

  if (!res.ok) {
    throw new Error(`Merge failed: ${res.status}`)
  }

  if (!res.body) {
    throw new Error('Response body is null')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let readResult = await reader.read()

  while (!readResult.done) {
    const chunk = decoder.decode(readResult.value)
    const lines = chunk.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      try {
        yield JSON.parse(line) as MergeChunk
      } catch (e) {
        console.error('Failed to parse merge event:', line, e)
      }
    }

    readResult = await reader.read()
  }
}

export const gitService = {
  getTree,
  getDiff,
  merge,
}
