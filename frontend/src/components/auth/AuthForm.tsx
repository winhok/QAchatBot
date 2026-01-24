import { CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, Terminal, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  onSuccess?: () => void
}

/**
 * 登录/注册表单组件 - Future Tech Redesign
 *
 * 视觉风格:
 * - 黑色磨砂玻璃背景
 * - 霓虹青柠色 (Neon Lime) 强调
 * - 科技感边框与排版
 * - 终端/控制台风格交互
 */
export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  function isFormValid(): boolean {
    if (!email || !password) {
      return false
    }
    if (isLogin) {
      return true
    }
    return Boolean(confirmPassword && name && password === confirmPassword && password.length >= 6)
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup'
      const body = isLogin ? { email, password } : { email, password, name }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '访问被拒绝')
      }

      if (data.requiresConfirmation) {
        setSuccessMessage('访问申请已提交，请验证通讯凭证（邮件）')
        return
      }

      setSuccessMessage(isLogin ? '身份验证成功' : '注册成功，正在建立连接...')
      setTimeout(() => onSuccess?.(), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '认证失败')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode(): void {
    setIsLogin(!isLogin)
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="relative w-full">
      {/* Tech Border Decorations */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
      <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-primary/50" />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-primary/50" />

      <div className="w-full bg-black/40 backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden group">
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-8 space-y-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-mono font-bold tracking-[0.2em] text-foreground">
            {isLogin ? '系统接入' : '新用户注册'}
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-primary/60 font-mono tracking-widest uppercase">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            安全连接: 加密
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {/* 用户名 */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pl-1">
                ID / 用户名
              </label>
              <div className="relative group/input">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-white/10 focus:border-primary/50 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm font-mono text-foreground transition-all placeholder:text-muted-foreground/30"
                  placeholder="USER_ID"
                />
              </div>
            </div>
          )}

          {/* 邮箱 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pl-1">
              通讯凭证 / 邮箱
            </label>
            <div className="relative group/input">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-white/10 focus:border-primary/50 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm font-mono text-foreground transition-all placeholder:text-muted-foreground/30"
                placeholder="user@system.net"
              />
            </div>
          </div>

          {/* 密码 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pl-1">
              访问密钥 / 密码
            </label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-2.5 bg-background/50 border border-white/10 focus:border-primary/50 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm font-mono text-foreground transition-all placeholder:text-muted-foreground/30"
                placeholder={isLogin ? '******' : 'MIN_LENGTH: 6'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 确认密码 */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pl-1">
                确认密钥
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-white/10 focus:border-primary/50 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm font-mono text-foreground transition-all placeholder:text-muted-foreground/30"
                  placeholder="CONFIRM_KEY"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] font-mono text-destructive flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full" />
                  密钥不匹配
                </p>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs font-mono flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <Terminal className="w-4 h-4 flex-shrink-0" />
              <span>ERROR: {error}</span>
            </div>
          )}

          {/* 成功提示 */}
          {successMessage && (
            <div className="bg-primary/10 border border-primary/20 p-3 text-primary text-xs font-mono flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>SUCCESS: {successMessage}</span>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={cn(
              'w-full py-3 mt-4 rounded-sm font-mono font-bold tracking-wider text-xs transition-all duration-200 relative overflow-hidden group/btn',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary',
              'flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)]',
            )}
          >
            {/* Glitch Overlay for Button */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />

            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {isLogin ? '[ 发起连接 ]' : '[ 创建账户 ]'}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground font-mono">
            {isLogin ? '未在数据库中索引?' : '已有访问权限?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 text-primary hover:text-primary/80 transition-colors uppercase tracking-wider relative group/link"
            >
              <span className="relative z-10">{isLogin ? '注册新用户' : '返回登录'}</span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary scale-x-0 group-hover/link:scale-x-100 transition-transform origin-right group-hover/link:origin-left" />
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
