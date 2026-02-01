import { Global, Module, forwardRef } from '@nestjs/common'

import { RedisModule } from '@/infrastructure/redis/redis.module'
import { RagModule } from '@/modules/rag/rag.module'

import { HistoryOptimizerService } from './history-optimizer.service'
import { MemoryBlockService } from './memory-block.service'
import { MemoryExtractionProcessor } from './memory-extraction.processor'
import { MemoryExtractionService } from './memory-extraction.service'
import { MemoryStoreService } from './memory-store.service'
import { SummarizerService } from './summarizer.service'
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
    MemoryBlockService,
    SummarizerService,
  ],
  exports: [
    MemoryStoreService,
    HistoryOptimizerService,
    MemoryExtractionService,
    UnifiedMemoryService,
    MemoryBlockService,
    SummarizerService,
  ],
})
export class MemoryModule {}
