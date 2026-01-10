import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { CommonModule } from '@/common/common.module'
import { RequestContextService } from '@/infrastructure/context/request-context.service'
import { PrismaModule } from '@/infrastructure/database/prisma.module'
import { PrismaService } from '@/infrastructure/database/prisma.service'
import { LoggerModule } from '@/infrastructure/logger/logger.module'
import { MemoryModule } from '@/infrastructure/memory/memory.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AgentModule } from './agent/agent.module'
import { AnalyticsModule, AuthModule, ConversationModule, RagModule } from './modules'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    LoggerModule,
    PrismaModule,
    MemoryModule,
    AuthModule,
    AgentModule,
    ConversationModule,
    AnalyticsModule,
    RagModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextService, PrismaService],
})
export class AppModule {}
