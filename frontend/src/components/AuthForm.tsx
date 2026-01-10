import { cn } from '@/lib/utils'
import { CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'

interface AuthFormProps {
  onSuccess?: () => void
}

/**
 * 登录/注册表单组件
 * 调用后端 /auth/* API
 *
 * 特性：
 * - 密码可见切换
 * - 注册时确认密码验证
 * - 成功提示后跳转
 * - 渐变按钮
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

  const isFormValid = () => {
    if (isLogin) {
      return email && password
    }
    return (
      email &&
      password &&
      confirmPassword &&
      name &&
      password === confirmPassword &&
      password.length >= 6
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/signin' : '/auth/signup'
      const body = isLogin ? { email, password } : { email, password, name }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '操作失败')
      }

      if (data.requiresConfirmation) {
        setSuccessMessage('注册成功！请查收验证邮件')
        return
      }

      // 成功提示后跳转
      setSuccessMessage(isLogin ? '登录成功！' : '注册成功！正在跳转...')
      setTimeout(() => onSuccess?.(), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '认证失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-card rounded-xl border border-border shadow-2xl">
      <h2 className="text-2xl font-bold text-center text-foreground mb-6">
        {isLogin ? '登录' : '注册'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 用户名（注册时显示） */}
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="请输入用户名"
              />
            </div>
          </div>
        )}

        {/* 邮箱 */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">邮箱</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* 密码 */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">密码</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder={isLogin ? '请输入密码' : '至少 6 位字符'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 确认密码（注册时显示） */}
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">确认密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="请再次输入密码"
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive mt-1">两次输入的密码不一致</p>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-start gap-2">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 成功提示 */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-500 text-sm flex items-start gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 提交按钮 - 渐变样式 */}
        <button
          type="submit"
          disabled={!isFormValid() || loading}
          className={cn(
            'w-full py-3 rounded-lg font-medium transition-all duration-200',
            'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
            'text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
            'disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2',
          )}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLogin ? '登录' : '注册'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? '还没有账号？' : '已有账号？'}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
            setSuccessMessage(null)
          }}
          className="ml-1 text-primary hover:underline font-medium"
        >
          {isLogin ? '注册' : '登录'}
        </button>
      </p>
    </div>
  )
}
