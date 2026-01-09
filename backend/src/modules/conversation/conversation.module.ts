import { Module } from '@nestjs/common'
import { SessionsModule } from './sessions/sessions.module'
import { MessagesModule } from './messages/messages.module'
import { ChatModule } from './chat/chat.module'
import { FoldersModule } from './folders/folders.module'

@Module({
  imports: [SessionsModule, MessagesModule, ChatModule, FoldersModule],
  exports: [SessionsModule, MessagesModule, ChatModule, FoldersModule],
})
export class ConversationModule {}
