import { RequestContextService } from '@/infrastructure/context/request-context.service'
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Module({
  providers: [PrismaService, RequestContextService],
  exports: [PrismaService],
})
export class PrismaModule {}
