import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { CommonModule } from '@/common/common.module';
import { RequestContextService } from '@/common/context/request-context.service';
import { LoggerModule } from '@/infrastructure/logger/logger.module';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/agent.module';
import { ConversationModule, AnalyticsModule } from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    LoggerModule,
    PrismaModule,
    AgentModule,
    ConversationModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextService, PrismaService],
})
export class AppModule {}
