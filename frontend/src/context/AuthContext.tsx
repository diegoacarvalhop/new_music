import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { AuthUser, LoginResponse } from '../types'
import type { AuthState } from '../api/client'

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  login: (data: LoginResponse, remember?: boolean) => void
  logout: () => void
  updateTokens: (at: string, rt: string) => void
  getAuth: () => AuthState
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'newmusic_access'
const REFRESH_KEY = 'newmusic_refresh'
const USER_KEY = 'newmusic_user'

function getStorage(useLocal: boolean): Storage {
  return useLocal ? localStorage : sessionStorage
}

function readInitialAuth(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
  const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
  try {
    const at = storage.getItem(TOKEN_KEY)
    const rt = storage.getItem(REFRESH_KEY)
    const stored = storage.getItem(USER_KEY)
    const user = stored ? JSON.parse(stored) : null
    if (!at || !rt) return { user: null, accessToken: null, refreshToken: null }
    return { user, accessToken: at, refreshToken: rt }
  } catch {
    return { user: null, accessToken: null, refreshToken: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialAuth)
  const [user, setUser] = useState<AuthUser | null>(initial.user)
  const [accessToken, setAccessToken] = useState<string | null>(initial.accessToken)
  const [refreshToken, setRefreshToken] = useState<string | null>(initial.refreshToken)
  const authRef = useRef<AuthState>({} as AuthState)

  const login = useCallback((data: LoginResponse, remember?: boolean) => {
    const { accessToken: at, refreshToken: rt, id, email, nome, perfil, professorId } = data
    const storage = getStorage(!!remember)
    setAccessToken(at)
    setRefreshToken(rt)
    setUser({ id, email, nome, perfil, professorId: professorId ?? null })
    storage.setItem(TOKEN_KEY, at)
    storage.setItem(REFRESH_KEY, rt)
    storage.setItem(USER_KEY, JSON.stringify({ id, email, nome, perfil, professorId: professorId ?? null }))
    if (remember) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(USER_KEY)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }, [])

  const logout = useCallback(() => {
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(USER_KEY)
  }, [])

  const updateTokens = useCallback((at: string, rt: string) => {
    setAccessToken(at)
    setRefreshToken(rt)
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, at)
    storage.setItem(REFRESH_KEY, rt)
  }, [])

  const getAuth = useCallback(() => authRef.current, [])

  useEffect(() => {
    authRef.current = { accessToken, refreshToken, updateTokens, logout }
  }, [accessToken, refreshToken, updateTokens, logout])

  const value: AuthContextValue = {
    user,
    accessToken,
    refreshToken,
    login,
    logout,
    updateTokens,
    getAuth,
    isAuthenticated: !!user
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
