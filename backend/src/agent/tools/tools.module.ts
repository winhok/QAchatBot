import { Module } from '@nestjs/common'
import { ToolsRegistry } from './tools.registry'

@Module({
  providers: [ToolsRegistry],
  exports: [ToolsRegistry],
})
export class ToolsModule {}
