import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator'
import { AuthService } from '@/modules/auth/auth.service'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { User } from '@supabase/supabase-js'
import type { Request } from 'express'
import { PinoLogger } from 'nestjs-pino'

/**
 * Extended Express Request with auth properties
 */
interface AuthenticatedRequest extends Request {
  user?: User
  token?: string
}

/**
 * Supabase Auth Guard (Global)
 *
 * 全局验证请求中的 Bearer Token，将用户信息附加到 request.user
 * 使用 @Public() 装饰器可跳过验证
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthGuard.name)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否标记为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    // 1. 优先从 Authorization Header 获取 token
    let token: string | undefined
    const authHeader = request.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // 2. 回退到 Cookie (sb-access-token)
    if (!token) {
      const cookies = request.cookies as Record<string, string | undefined> | undefined
      token = cookies?.['sb-access-token']
    }

    if (!token) {
      throw new UnauthorizedException('Missing authentication')
    }

    // 3. 验证 token
    const user = await this.authService.verifyToken(token)

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token')
    }

    // Attach user and token to request for downstream use
    request.user = user
    request.token = token

    this.logger.debug({ event: 'auth_success', userId: user.id })
    return true
  }
}
