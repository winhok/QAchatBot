export type {
  MemoryCategory,
  MemoryEntry,
  MemorySchema,
  MemoryScope,
  MergedMemory,
  UpdateMode,
  UserProfile,
} from '@/shared/schemas/memory.types'
export { PrismaModule } from './database/prisma.module'
export { PrismaService } from './database/prisma.service'
export { LoggerModule } from './logger/logger.module'
export { LoggerService } from './logger/logger.service'
export { HistoryOptimizerService } from './memory/history-optimizer.service'
export { MemoryExtractionService } from './memory/memory-extraction.service'
export { MemoryStoreService } from './memory/memory-store.service'
export { MemoryModule } from './memory/memory.module'
export { UnifiedMemoryService } from './memory/unified-memory.service'
export { RedisModule, RedisService } from './redis'
