import { useCallback, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
}

/**
 * 认证状态 Hook
 * 通过后端 /auth/me API 获取用户状态
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/me`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const signOut = useCallback(async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }, [])

  const refetch = useCallback(() => {
    setLoading(true)
    fetchUser()
  }, [fetchUser])

  return { user, loading, signOut, refetch }
}
