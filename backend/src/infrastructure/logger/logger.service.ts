import { RequestContextService } from '@/common/context/request-context.service'
import { Inject, Injectable } from '@nestjs/common'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

type LogMetadata = Record<string, unknown>

@Injectable()
export class LoggerService {
  constructor(
    @InjectPinoLogger(LoggerService.name)
    private readonly logger: PinoLogger,
    @Inject(RequestContextService)
    private readonly contextService: RequestContextService,
  ) {}

  private buildLogObject(
    context: string,
    message: string,
    meta?: LogMetadata,
  ): [LogMetadata, string] {
    return [
      {
        traceId: this.contextService.getTraceId() || 'N/A',
        context,
        ...meta,
      },
      message,
    ]
  }

  debug(context: string, message: string, meta?: LogMetadata): void {
    this.logger.debug(...this.buildLogObject(context, message, meta))
  }

  info(context: string, message: string, meta?: LogMetadata): void {
    this.logger.info(...this.buildLogObject(context, message, meta))
  }

  warn(context: string, message: string, meta?: LogMetadata): void {
    this.logger.warn(...this.buildLogObject(context, message, meta))
  }

  error(context: string, message: string, meta?: LogMetadata): void {
    this.logger.error(...this.buildLogObject(context, message, meta))
  }

  logQueryResult<T>(context: string, method: string, result: T[] | T | null): void {
    const count = Array.isArray(result) ? result.length : result ? 1 : 0
    this.debug(context, 'Query completed', { method, resultCount: count })
  }
}
