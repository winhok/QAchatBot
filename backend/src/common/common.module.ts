import { RequestContextService } from '@/common/context/request-context.service'
import { LoggingMiddleware } from '@/common/middleware/logging.middleware'
import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'

@Global()
@Module({
  providers: [RequestContextService, PrismaService, LoggingMiddleware],
  exports: [RequestContextService, PrismaService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*')
  }
}
