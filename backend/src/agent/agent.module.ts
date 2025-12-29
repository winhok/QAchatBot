import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ToolsRegistry } from './tools';
import { ChatbotService, QaChatbotService } from './graphs';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ToolsRegistry, ChatbotService, QaChatbotService],
  exports: [ToolsRegistry, ChatbotService, QaChatbotService],
})
export class AgentModule {}
