import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import type { Request } from 'express'

interface AuthenticatedRequest extends Request {
  user?: User
}

/**
 * 从请求中提取当前登录用户
 *
 * @example
 * // 获取完整用户对象
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user
 * }
 *
 * @example
 * // 只获取用户 ID
 * @Get('sessions')
 * async getSessions(@CurrentUser('id') userId: string) {
 *   return this.sessionsService.findAll(userId)
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    const user = request.user

    return data ? user?.[data] : user
  },
)
