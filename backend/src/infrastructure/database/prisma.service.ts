import { RequestContextService } from '@/common/context/request-context.service';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Pool } from 'pg';
import { PrismaClient } from '../../../generated/prisma/index.js';

const isDev = process.env.NODE_ENV !== 'production';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(RequestContextService)
    private readonly contextService: RequestContextService,
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: isDev
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ],
    });

    if (isDev) {
      (this as any).$on(
        'query',
        (e: { query: string; params: string; duration: number }) => {
          const traceId = this.contextService.getTraceId() || 'N/A';
          this.logger.debug({
            traceId,
            event: 'query',
            query: e.query,
            params: e.params,
            duration: e.duration,
          });
        },
      );
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.info({ event: 'database', status: 'connected' });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
