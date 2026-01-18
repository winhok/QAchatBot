import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// 开发环境优先使用 TEST_DATABASE_URL
const isDev = process.env.NODE_ENV !== 'production'
const databaseUrl =
  isDev && process.env.TEST_DATABASE_URL ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL

if (isDev && process.env.TEST_DATABASE_URL) {
  console.log('[Prisma] Using TEST_DATABASE_URL (development mode)')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
