import { Public } from '@/common/decorators/public.decorator'
import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'

const COOKIE_NAME = 'sb-access-token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms
}

/**
 * Safely get a typed cookie value from request
 */
function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined
  return cookies?.[name]
}

interface SignInDto {
  email: string
  password: string
}

interface SignUpDto {
  email: string
  password: string
  name: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   * POST /auth/signin
   */
  @Public()
  @Post('signin')
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const { email, password } = dto

    if (!email || !password) {
      return { success: false, error: '请填写所有必填字段' }
    }

    const result = await this.authService.signIn(email, password)

    if (result.error) {
      return { success: false, error: '邮箱或密码错误' }
    }

    // Set httpOnly cookie
    res.cookie(COOKIE_NAME, result.session.access_token, COOKIE_OPTIONS)

    const userName = (result.user.user_metadata as Record<string, unknown> | undefined)?.name
    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: typeof userName === 'string' ? userName : result.user.email,
      },
    }
  }

  /**
   * 用户注册
   * POST /auth/signup
   */
  @Public()
  @Post('signup')
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    const { email, password, name } = dto

    if (!email || !password || !name) {
      return { success: false, error: '请填写所有必填字段' }
    }

    if (password.length < 6) {
      return { success: false, error: '密码至少需要6位字符' }
    }

    const result = await this.authService.signUp(email, password, name)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Check if email confirmation required
    if (result.user && !result.session) {
      return {
        success: true,
        message: '注册成功！请查收验证邮件',
        requiresConfirmation: true,
      }
    }

    // Set cookie if session exists
    if (result.session?.access_token) {
      res.cookie(COOKIE_NAME, result.session.access_token, COOKIE_OPTIONS)
    }

    const userName = (result.user!.user_metadata as Record<string, unknown> | undefined)?.name
    return {
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: typeof userName === 'string' ? userName : name,
      },
      requiresConfirmation: false,
    }
  }

  /**
   * 用户登出
   * POST /auth/signout
   */
  @Public()
  @Post('signout')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = getCookie(req, COOKIE_NAME)

    if (token) {
      await this.authService.signOut(token)
    }

    res.clearCookie(COOKIE_NAME)
    return { success: true }
  }

  /**
   * 获取当前用户信息
   * GET /auth/me
   */
  @Public()
  @Get('me')
  async getMe(@Req() req: Request) {
    const token = getCookie(req, COOKIE_NAME)

    if (!token) {
      return { success: false, user: null }
    }

    const user = await this.authService.verifyToken(token)

    if (!user) {
      return { success: false, user: null }
    }

    const userName = (user.user_metadata as Record<string, unknown> | undefined)?.name
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: typeof userName === 'string' ? userName : user.email,
      },
    }
  }
}
