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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthForm onSuccess={() => window.location.reload()} />
      </div>
    )
  }

  return <>{children}</>
}
