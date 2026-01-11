import { AppModule } from '@/app.module'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'
import { ProxyAgent, setGlobalDispatcher } from 'undici'

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY
if (proxyUrl) {
  console.log('[PROXY] Using proxy:', proxyUrl)
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const logger = app.get(Logger)
  app.useLogger(logger)

  // 启用 cookie 解析（用于读取认证 cookie）
  app.use(cookieParser())

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // 允许跨域携带 cookie
  })

  await app.listen(process.env.PORT ?? 3000)

  logger.log('NestJS server running on http://localhost:3000')
}
void bootstrap()
