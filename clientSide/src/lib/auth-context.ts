import { createContext, useContext } from 'react'

export type User = { id: number; name: string; email: string }

export type AuthContextValue = {
  user: User | null
  // 'checking' while we confirm a saved token on page load, so we don't flash the login page
  status: 'checking' | 'ready'
  logIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  logOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
