import type { CanvasArtifact, CanvasLanguage, CanvasState } from '@/types/canvas'
import { create } from 'zustand'

// 辅助函数：深度克隆 Map
const cloneArtifactsMap = (original: Map<string, Map<string, CanvasArtifact>>) => {
  const newMap = new Map<string, Map<string, CanvasArtifact>>()
  for (const [key, value] of original) {
    newMap.set(key, new Map(value))
  }
  return newMap
}

export const useCanvasArtifacts = create<CanvasState>((set, get) => ({
  artifacts: new Map(),
  activeArtifactId: null,
  isCanvasVisible: false,
  initialTab: 'preview',

  createArtifact: (messageId, data) => {
    set((state) => {
      const newMap = cloneArtifactsMap(state.artifacts)

      if (!newMap.has(messageId)) {
        newMap.set(messageId, new Map())
      }
      const messageArtifacts = newMap.get(messageId)!

      const existing = messageArtifacts.get(data.id)
      const currentVersion = existing ? existing.currentVersion + 1 : 1

      const newArtifact: CanvasArtifact = {
        id: data.id,
        type: data.type,
        title: data.title,
        code: { language: 'jsx', content: '' },
        status: 'creating',
        isStreaming: true,
        messageId,
        sessionId: data.sessionId,
        currentVersion,
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      messageArtifacts.set(data.id, newArtifact)
      return { artifacts: newMap }
    })
  },

  updateArtifact: (messageId, artifactId, updates) => {
    set((state) => {
      const newMap = cloneArtifactsMap(state.artifacts)
      const messageArtifacts = newMap.get(messageId)
      if (!messageArtifacts) return state

      const artifact = messageArtifacts.get(artifactId)
      if (!artifact) return state

      const updated = {
        ...artifact,
        ...updates,
        updatedAt: new Date(),
      }
      messageArtifacts.set(artifactId, updated)
      return { artifacts: newMap }
    })
  },

  startCode: (messageId, artifactId, language) => {
    get().updateArtifact(messageId, artifactId, {
      code: { language, content: '' },
      status: 'streaming',
    })
  },

  appendCodeChunk: (messageId, artifactId, chunk) => {
    set((state) => {
      const newMap = cloneArtifactsMap(state.artifacts)
      const messageArtifacts = newMap.get(messageId)
      if (!messageArtifacts) return state

      const artifact = messageArtifacts.get(artifactId)
      if (!artifact) return state

      artifact.code.content += chunk
      return { artifacts: newMap }
    })
  },

  endCode: (messageId, artifactId, fullContent) => {
    get().updateArtifact(messageId, artifactId, {
      code: { ...get().getArtifact(messageId, artifactId)!.code, content: fullContent },
      status: 'ready',
      isStreaming: false,
    })
  },

  setActiveArtifactId: (id) => set({ activeArtifactId: id }),

  setIsCanvasVisible: (visible, initialTab = 'preview') =>
    set({ isCanvasVisible: visible, initialTab }),

  getArtifact: (messageId, artifactId) => {
    const { artifacts } = get()
    return artifacts.get(messageId)?.get(artifactId)
  },

  restoreArtifactsFromMessage: (messageId, content) => {
    // 匹配 <canvasArtifact id="xxx" title="xxx">...</canvasArtifact>
    const artifactRegex =
      /<canvasArtifact[^>]*id=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>([\s\S]*?)<\/canvasArtifact>/g
    let match: RegExpExecArray | null
    let hasChanges = false

    // 先克隆当前状态
    const currentArtifacts = cloneArtifactsMap(get().artifacts)

    while ((match = artifactRegex.exec(content)) !== null) {
      const artifactId = match[1]
      const title = match[2]
      const innerContent = match[3]

      // 提取代码内容和语言
      const codeMatch =
        /<canvasCode[^>]*language=["']?(\w+)["']?[^>]*>([\s\S]*?)<\/canvasCode>/.exec(innerContent)
      const language = (codeMatch?.[1] as CanvasLanguage) || 'jsx'
      // 如果没有 canvasCode 标签，可能内容就在 artifact 标签内（简化情况）
      const codeContent = codeMatch?.[2] || innerContent

      if (!currentArtifacts.has(messageId)) {
        currentArtifacts.set(messageId, new Map())
      }
      const messageArtifacts = currentArtifacts.get(messageId)!

      // 如果已存在且内容相同，则跳过
      const existing = messageArtifacts.get(artifactId)
      if (existing && existing.code.content === codeContent.trim()) {
        continue
      }

      const artifact: CanvasArtifact = {
        id: artifactId,
        type: 'component',
        title,
        code: {
          language,
          content: codeContent.trim(),
        },
        status: 'ready',
        isStreaming: false,
        messageId,
        sessionId: '', // 历史记录恢复时暂无 sessionId
        currentVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      messageArtifacts.set(artifactId, artifact)
      hasChanges = true
    }

    if (hasChanges) {
      set({ artifacts: currentArtifacts })
    }
  },

  clear: () => set({ artifacts: new Map(), activeArtifactId: null, isCanvasVisible: false }),
}))
