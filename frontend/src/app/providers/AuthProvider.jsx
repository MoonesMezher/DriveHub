import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, ENDPOINTS } from '@/lib/api'
import {
  userHasRole,
  userHasActiveRole,
  canAccessRoute,
  resolvePostLoginRoute,
  healPaidStudentSession,
  resolveEffectiveActiveRole,
} from '@/lib/auth/authUtils'
import { hasPermission, hasAnyPermission } from '@/lib/auth/rolePermissions'
import { storage } from '@/lib/helpers/storage'
import { queryClient } from '@/app/providers/QueryProvider'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => apiClient.getToken())
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(Boolean(apiClient.getToken()))

  const applySession = useCallback((data) => {
    apiClient.setTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    })
    setTokenState(apiClient.getToken())
    const healed = healPaidStudentSession(data.user)
    setUser(healed)
    return { ...data, user: healed }
  }, [])

  const clearSession = useCallback(() => {
    apiClient.clearTokens()
    storage.clearAll()
    queryClient.clear()
    setTokenState(null)
    setUser(null)
  }, [])

  const bootstrap = useCallback(async () => {
    if (!apiClient.getToken()) {
      setBootstrapping(false)
      return
    }
    try {
      const res = await apiClient.get(ENDPOINTS.auth.me)
      setUser(healPaidStudentSession(res.data.user))
      setTokenState(apiClient.getToken())
    } catch {
      clearSession()
    } finally {
      setBootstrapping(false)
    }
  }, [clearSession])

  useEffect(() => {
    apiClient.setOnUnauthorized(clearSession)
    bootstrap()
  }, [bootstrap, clearSession])

  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const res = await apiClient.post(ENDPOINTS.auth.login, credentials)
      return applySession(res.data)
    } finally {
      setLoading(false)
    }
  }, [applySession])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const res = await apiClient.post(ENDPOINTS.auth.register, payload)
      return applySession(res.data)
    } finally {
      setLoading(false)
    }
  }, [applySession])

  const logout = useCallback(async () => {
    try {
      if (apiClient.getToken()) {
        await apiClient.post(ENDPOINTS.auth.logout, {
          refreshToken: apiClient.getRefreshToken(),
        })
      }
    } catch {
      // always clear locally
    } finally {
      clearSession()
    }
  }, [clearSession])

  const switchContext = useCallback(async ({ role, schoolId = null }) => {
    const res = await apiClient.post(ENDPOINTS.auth.switchContext, { role, schoolId })
    apiClient.setTokens({ accessToken: res.data.accessToken || res.data.token })
    setTokenState(apiClient.getToken())
    const healed = healPaidStudentSession(res.data.user)
    setUser(healed)
    return { ...res.data, user: healed }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!apiClient.getToken()) return null
    const res = await apiClient.get(ENDPOINTS.auth.me)
    const healed = healPaidStudentSession(res.data.user)
    setUser(healed)
    setTokenState(apiClient.getToken())
    return healed
  }, [])

  const activeRole = resolveEffectiveActiveRole(user)
  const permissions = user?.permissions || []

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      bootstrapping,
      isAuthenticated: Boolean(token && user),
      activeRole,
      permissions,
      login,
      register,
      logout,
      switchContext,
      refreshUser,
      setUser,
      hasRole: (...roles) => userHasRole(user, ...roles),
      hasActiveRole: (...roles) => userHasActiveRole(user, ...roles),
      can: (permission) => hasPermission(permissions, permission),
      canAny: (perms) => hasAnyPermission(permissions, perms),
      canAccess: (rule) => canAccessRoute(user, rule),
      getHomeRoute: () => resolvePostLoginRoute(user),
    }),
    [user, token, loading, bootstrapping, activeRole, permissions, login, register, logout, switchContext, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
