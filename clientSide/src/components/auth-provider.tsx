import { useEffect, useState, type ReactNode } from 'react'
import { api, tokenStorage } from '@/lib/api'
import { AuthContext, type User } from '@/lib/auth-context'

type AuthResponse = { user: User; token: string }

// Holds "who is logged in" for the whole app. Any component can read it with useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // If there's no saved token there's nothing to check, so we're ready straight away.
  const [status, setStatus] = useState<'checking' | 'ready'>(() => (tokenStorage.get() ? 'checking' : 'ready'))

  // On page load, ask the API who the saved token belongs to.
  // If the token expired or is invalid, forget it and show the login page.
  useEffect(() => {
    if (!tokenStorage.get()) return
    api<{ user: User }>('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => tokenStorage.clear())
      .finally(() => setStatus('ready'))
  }, [])

  function saveSession(data: AuthResponse) {
    tokenStorage.set(data.token)
    setUser(data.user)
  }

  async function logIn(email: string, password: string) {
    saveSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }))
  }

  async function signUp(name: string, email: string, password: string) {
    saveSession(await api<AuthResponse>('/auth/signup', { method: 'POST', body: { name, email, password } }))
  }

  function logOut() {
    tokenStorage.clear()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, status, logIn, signUp, logOut }}>{children}</AuthContext.Provider>
}
