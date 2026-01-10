import { AuthGuard } from '@/common/guards/auth.guard'
import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

/**
 * 认证模块
 *
 * 全局模块，提供：
 * - /auth/* API 路由
 * - AuthService: Supabase 认证
 * - AuthGuard: 全局路由守卫（使用 @Public() 跳过）
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
