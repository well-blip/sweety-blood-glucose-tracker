import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/lib/auth-context'

// Wraps pages that need a logged-in user. Logged-out visitors go to /login,
// and after logging in they come back to the page they wanted.
export function RequireAuth() {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return <p className="p-10 text-center text-muted-foreground">Loading…</p>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
