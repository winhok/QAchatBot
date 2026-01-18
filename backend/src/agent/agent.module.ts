import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ChatbotService } from './graphs'
import { ToolsRegistry } from './tools'
import { ModelFactory } from './utils'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ToolsRegistry, ChatbotService, ModelFactory],
  exports: [ToolsRegistry, ChatbotService, ModelFactory],
})
export class AgentModule {}
