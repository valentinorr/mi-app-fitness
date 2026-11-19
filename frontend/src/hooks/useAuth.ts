import { useState, useEffect, useCallback } from 'react'
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

export function useAuth() {
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

  return { user, loading, login, register, logout, isAuthenticated: !!user, checkAuth }
}