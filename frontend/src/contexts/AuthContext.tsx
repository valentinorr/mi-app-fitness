import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api } from '../api/client'
import type { UserResponse } from '../types'

function parseJwt(token: string): { sub?: string; email?: string } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

interface AuthContextType {
  user: UserResponse | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name?: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(() => {
    const token = api.getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const payload = parseJwt(token)
      const email = payload?.sub || payload?.email
      if (email) {
        setUser({
          id: 0,
          email,
          created_at: new Date().toISOString(),
        })
      } else {
        setUser({ id: 0, email: 'usuario', created_at: new Date().toISOString() })
      }
      setLoading(false)
    } catch {
      api.logout()
      setUser(null)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    await api.login({ username: email, password })
    checkAuth()
  }

  const register = async (email: string, password: string, full_name?: string) => {
    await api.register({ email, password, full_name })
    await login(email, password)
  }

  const logout = () => {
    api.logout()
    checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}