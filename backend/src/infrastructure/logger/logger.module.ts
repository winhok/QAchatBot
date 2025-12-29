import { RequestContextService } from '@/common/context/request-context.service';
import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LoggerService } from './logger.service';

const isDev = process.env.NODE_ENV !== 'production';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport: isDev
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                levelFirst: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
        level: isDev ? 'debug' : 'info',
        autoLogging: false,
        quietReqLogger: true,
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
      },
    }),
  ],
  providers: [LoggerService, RequestContextService],
  exports: [LoggerService, PinoLoggerModule, RequestContextService],
})
export class LoggerModule {}
