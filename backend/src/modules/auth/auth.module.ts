import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

/**
 * 认证模块
 *
 * 全局模块，提供：
 * - /auth/* API 路由
 * - AuthService: Supabase 认证
 * - AuthGuard: 路由守卫
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
