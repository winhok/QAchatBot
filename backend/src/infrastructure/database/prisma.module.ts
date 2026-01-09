import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { RequestContextService } from '@/common/context/request-context.service'

@Module({
  providers: [PrismaService, RequestContextService],
  exports: [PrismaService],
})
export class PrismaModule {}
