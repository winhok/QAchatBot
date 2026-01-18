import { registerAs } from '@nestjs/config'
import { getDatabaseUrl } from './database-url'

export default registerAs('database', () => ({
  url: getDatabaseUrl(),
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
}))
