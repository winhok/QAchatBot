function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID()
    } catch (error) {
      console.warn('crypto.randomUUID() failed, falling back to manual generation', error)
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getOrCreateThreadId() {
  if (typeof window === 'undefined') {
    return ''
  }
  let threadId = localStorage.getItem('thread_id')
  if (!threadId) {
    threadId = generateUUID()
    localStorage.setItem('thread_id', threadId)
  }
  return threadId
}

export function setThreadId(threadId: string) {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem('thread_id', threadId)
}
