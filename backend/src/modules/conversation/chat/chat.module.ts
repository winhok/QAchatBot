import { AgentModule } from '@/agent/agent.module'
import { MessagesModule } from '../messages/messages.module'
import { SessionsModule } from '../sessions/sessions.module'
import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [AgentModule, MessagesModule, SessionsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
