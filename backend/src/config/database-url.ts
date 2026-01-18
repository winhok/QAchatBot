/**
 * 数据库 URL 获取工具
 * 开发环境优先使用 TEST_DATABASE_URL，生产环境使用 DATABASE_URL
 */

const isDev = process.env.NODE_ENV !== 'production'

/**
 * 获取当前环境的数据库连接 URL
 * - 开发环境：优先使用 TEST_DATABASE_URL，如果没有则回退到 DATABASE_URL
 * - 生产环境：使用 DATABASE_URL
 */
export function getDatabaseUrl(): string {
  if (isDev && process.env.TEST_DATABASE_URL) {
    console.log('[Database] Using TEST_DATABASE_URL (development mode)')
    return process.env.TEST_DATABASE_URL
  }
  return process.env.DATABASE_URL || ''
}

/**
 * 检查是否使用测试数据库
 */
export function isUsingTestDatabase(): boolean {
  return isDev && !!process.env.TEST_DATABASE_URL
}
