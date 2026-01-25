import { AgentModule } from '@/agent/agent.module'
import { Module } from '@nestjs/common'
import { MergeService } from '../merge/merge.service'
import { MessagesModule } from '../messages/messages.module'
import { ReasoningModule } from '../reasoning/reasoning.module'
import { SessionsModule } from '../sessions/sessions.module'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [AgentModule, MessagesModule, SessionsModule, ReasoningModule],
  controllers: [ChatController],
  providers: [ChatService, MergeService],
  exports: [MergeService],
})
export class ChatModule {}
