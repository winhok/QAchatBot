import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * 标记路由为公开访问，无需登录验证
 *
 * @example
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
