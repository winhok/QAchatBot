import {
  RequestContext,
  RequestContextService,
} from '@/common/context/request-context.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

const isDev = process.env.NODE_ENV !== 'production';

// 生产环境需要过滤的敏感 header
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'set-cookie',
]);

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: RequestContextService,
    @InjectPinoLogger(LoggingMiddleware.name)
    private readonly logger: PinoLogger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const traceId =
      (req.headers['x-trace-id'] as string) ||
      this.contextService.generateTraceId();
    const start = Date.now();

    res.setHeader('X-Trace-Id', traceId);

    // 请求日志
    if (isDev) {
      // 开发环境：全量打印
      const headers = { ...req.headers };
      this.logger.info({
        traceId,
        event: 'request',
        method: req.method,
        url: req.url,
        headers,
        body: req.body,
        query: req.query,
      });
    } else {
      // 生产环境：只打印关键信息，过滤敏感 header
      const safeHeaders: Record<string, string | string[] | undefined> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (!SENSITIVE_HEADERS.has(key.toLowerCase())) {
          safeHeaders[key] = value;
        }
      }
      this.logger.info({
        traceId,
        event: 'request',
        method: req.method,
        url: req.url,
        headers: safeHeaders,
        userId: (req as any).user?.id,
      });
    }

    const store: RequestContext = { traceId, startTime: start };

    const originalSend = res.send.bind(res);
    res.send = (resBody: unknown) => {
      const duration = Date.now() - start;
      const bodyStr =
        resBody === undefined || resBody === null
          ? ''
          : typeof resBody === 'string'
            ? resBody
            : JSON.stringify(resBody);

      if (isDev) {
        // 开发环境：全量打印响应体
        this.logger.info({
          traceId,
          event: 'response',
          statusCode: res.statusCode,
          duration,
          body: bodyStr,
        });
      } else {
        // 生产环境：只打印关键指标
        const logData: Record<string, unknown> = {
          traceId,
          event: 'response',
          statusCode: res.statusCode,
          duration,
          bodyLength: bodyStr.length,
        };

        // 错误响应时额外打印截断的 body
        if (res.statusCode >= 400) {
          logData.body = bodyStr.slice(0, 500);
          this.logger.error(logData);
        } else {
          this.logger.info(logData);
        }
      }

      return originalSend(resBody);
    };

    this.contextService.run(store, () => next());
  }
}
