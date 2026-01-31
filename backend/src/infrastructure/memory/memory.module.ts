import { RedisModule } from '@/infrastructure/redis/redis.module'
import { RagModule } from '@/modules/rag/rag.module'
import { Global, Module, forwardRef } from '@nestjs/common'
import { HistoryOptimizerService } from './history-optimizer.service'
import { MemoryExtractionProcessor } from './memory-extraction.processor'
import { MemoryExtractionService } from './memory-extraction.service'
import { MemoryStoreService } from './memory-store.service'
import { UnifiedMemoryService } from './unified-memory.service'

@Global()
@Module({
  imports: [
    RedisModule,
    forwardRef(() => RagModule), // 使用 forwardRef 避免循环依赖
  ],
  providers: [
    MemoryStoreService,
    HistoryOptimizerService,
    MemoryExtractionService,
    MemoryExtractionProcessor,
    UnifiedMemoryService,
  ],
  exports: [
    MemoryStoreService,
    HistoryOptimizerService,
    MemoryExtractionService,
    UnifiedMemoryService,
  ],
})
export class MemoryModule {}
