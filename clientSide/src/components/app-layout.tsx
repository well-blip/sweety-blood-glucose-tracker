import { LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Readings' },
  { to: '/reports', label: 'Reports' },
]

// The logged-in shell: a slim header (logo, two links, log out) and the current page below.
export function AppLayout() {
  const { user, logOut } = useAuth()

  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-background">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-8">
            <Logo />
            <nav aria-label="Main" className="flex gap-6">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      // The active page gets a dark underline; the others stay quiet until hovered
                      '-mb-px border-b-2 border-transparent py-2 text-muted-foreground transition-colors hover:text-foreground',
                      isActive && 'border-foreground font-medium text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-muted-foreground sm:inline">{user?.name}</span>
            <Button variant="ghost" size="lg" onClick={logOut}>
              <LogOut aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
