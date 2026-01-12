import type { Session } from '@/types/stores'

/**
 * Generates a display title for a session.
 * Returns the session name if available, otherwise generates one from the session ID.
 */
export function getSessionTitle(session: Session): string {
  return session.name || `会话::${session.id.slice(0, 8).toUpperCase()}`
}

/**
 * Time constants in milliseconds
 */
const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const WEEK = 604_800_000

/**
 * Formats a timestamp into a human-readable relative time string.
 * Returns empty string if timestamp is invalid or undefined.
 */
export function formatRelativeTime(timestamp: string | undefined): string {
  if (!timestamp) return ''

  try {
    const date = new Date(timestamp)
    const diff = Date.now() - date.getTime()

    if (diff < MINUTE) return '刚刚'
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`
    if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`
    if (diff < WEEK) return `${Math.floor(diff / DAY)} 天前`

    return date.toLocaleDateString('zh-CN')
  } catch {
    return ''
  }
}
