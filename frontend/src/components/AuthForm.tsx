import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface AuthFormProps {
  onSuccess?: () => void
}

/**
 * 登录/注册表单组件
 * 调用后端 /auth/* API
 */
export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/signin' : '/auth/signup'
      const body = isLogin ? { email, password } : { email, password, name }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '操作失败')
      }

      if (data.requiresConfirmation) {
        setError('注册成功！请查收验证邮件')
        return
      }

      onSuccess?.()
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
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">用户名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="请输入用户名"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            placeholder="至少 6 位字符"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-3 rounded-lg font-medium transition-all duration-200',
            'bg-primary text-primary-foreground hover:bg-primary/90',
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
          onClick={() => setIsLogin(!isLogin)}
          className="ml-1 text-primary hover:underline font-medium"
        >
          {isLogin ? '注册' : '登录'}
        </button>
      </p>
    </div>
  )
}
