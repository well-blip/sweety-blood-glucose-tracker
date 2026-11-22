import { Droplet, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Readings' },
  { to: '/reports', label: 'Reports' },
]

// The logged-in shell: a tinted nav band on top, the current page below.
export function AppLayout() {
  const { user, logOut } = useAuth()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted px-4 py-2">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <Droplet className="size-5 text-sky-600" aria-hidden="true" />
          Sweety
        </span>

        <nav aria-label="Main" className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-4 py-2 text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'border bg-background font-medium text-foreground shadow-xs',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-muted-foreground sm:inline">{user?.name}</span>
          <Button variant="outline" size="lg" onClick={logOut}>
            <LogOut aria-hidden="true" />
            Log out
          </Button>
        </div>
      </header>

      <main className="mt-6">
        <Outlet />
      </main>
    </div>
  )
}
