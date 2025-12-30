import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService, QaChatbotService } from './graphs';
import { ToolsRegistry } from './tools';
import { ModelFactory } from './utils';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ToolsRegistry, ChatbotService, QaChatbotService, ModelFactory],
  exports: [ToolsRegistry, ChatbotService, QaChatbotService, ModelFactory],
})
export class AgentModule {}
