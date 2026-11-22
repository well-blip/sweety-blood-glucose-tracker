import { ChevronDown, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Readings' },
  { to: '/reports', label: 'Reports' },
]

// "Jane Doe" → "JD"
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

// The logged-in shell: a light, sticky header (logo, page links, account menu) and the page below.
export function AppLayout() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto">
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

// Avatar + name button that opens a small menu with the account details and "Log out".
function AccountMenu() {
  const { user, logOut } = useAuth()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-8">
          <AvatarFallback className="bg-zinc-900 text-xs font-medium text-zinc-50">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-[0.95rem] font-medium sm:inline">{user.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5 py-2">
          <span className="font-medium text-foreground">{user.name}</span>
          <span className="truncate text-sm font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logOut} className="py-2 text-base">
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
