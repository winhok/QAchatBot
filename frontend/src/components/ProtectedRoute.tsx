import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from './AuthForm'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 路由守卫组件
 * 通过后端 /auth/me 检查登录状态
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-primary font-mono gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/10 animate-pulse" />
        </div>
        <div className="text-xs tracking-[0.2em] animate-pulse">系统初始化中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,100,0.03),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md px-4">
          <AuthForm onSuccess={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
