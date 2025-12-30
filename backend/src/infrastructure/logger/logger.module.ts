import { RequestContextService } from '@/common/context/request-context.service';
import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import pretty from 'pino-pretty';
import { LoggerService } from './logger.service';

const isDev = process.env.NODE_ENV !== 'production';

// 开发环境：主线程同步流，保证日志顺序
const devStream = isDev
  ? pretty({
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      sync: true,
    })
  : undefined;

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        stream: devStream,
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
