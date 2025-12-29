import { Module } from '@nestjs/common';
import { SessionsModule } from './sessions/sessions.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [SessionsModule, MessagesModule, ChatModule],
  exports: [SessionsModule, MessagesModule, ChatModule],
})
export class ConversationModule {}
