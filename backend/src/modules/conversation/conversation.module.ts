import { Module } from '@nestjs/common'
import { ChatModule } from './chat/chat.module'
import { FoldersModule } from './folders/folders.module'
import { MessagesModule } from './messages/messages.module'
import { ReasoningModule } from './reasoning/reasoning.module'
import { SessionsModule } from './sessions/sessions.module'

@Module({
  imports: [SessionsModule, MessagesModule, ChatModule, FoldersModule, ReasoningModule],
  exports: [SessionsModule, MessagesModule, ChatModule, FoldersModule, ReasoningModule],
})
export class ConversationModule {}
