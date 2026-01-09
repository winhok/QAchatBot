import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

/**
 * Supabase 认证服务
 *
 * 提供用户认证功能：
 * - 登录/注册/登出
 * - JWT Token 验证
 */
@Injectable()
export class AuthService implements OnModuleInit {
  private supabase: SupabaseClient

  constructor(
    private readonly config: ConfigService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL')
    const supabaseAnonKey = this.config.get<string>('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    this.logger.info({ event: 'supabase', status: 'initialized' })
  }

  /**
   * 邮箱密码登录
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      this.logger.warn({ event: 'signin_failed', error: error.message })
      return { user: null, session: null, error }
    }

    return { user: data.user, session: data.session, error: null }
  }

  /**
   * 邮箱密码注册
   */
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      this.logger.warn({ event: 'signup_failed', error: error.message })
      return { user: null, session: null, error }
    }

    return { user: data.user, session: data.session, error: null }
  }

  /**
   * 用户登出
   */
  async signOut(token: string) {
    // Create an admin client with the user's token
    const client = this.createAuthenticatedClient(token)
    const { error } = await client.auth.signOut()

    if (error) {
      this.logger.warn({ event: 'signout_failed', error: error.message })
    }

    return { error }
  }

  /**
   * 验证 JWT Token 并返回用户信息
   */
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token)

    if (error) {
      this.logger.warn({ event: 'auth_verify_failed', error: error.message })
      return null
    }

    return data.user
  }

  /**
   * 获取 Supabase 客户端
   */
  getClient(): SupabaseClient {
    return this.supabase
  }

  /**
   * 使用用户的 JWT 创建认证客户端
   */
  createAuthenticatedClient(token: string): SupabaseClient {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL')!
    const supabaseAnonKey = this.config.get<string>('SUPABASE_ANON_KEY')!

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }
}
