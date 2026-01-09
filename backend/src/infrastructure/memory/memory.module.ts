import { Global, Module } from '@nestjs/common'
import { MemoryStoreService } from './memory-store.service'
import { HistoryOptimizerService } from './history-optimizer.service'

@Global()
@Module({
  providers: [MemoryStoreService, HistoryOptimizerService],
  exports: [MemoryStoreService, HistoryOptimizerService],
})
export class MemoryModule {}
