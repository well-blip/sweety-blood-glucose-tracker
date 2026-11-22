import type { ReactNode } from 'react'
import { Droplet } from 'lucide-react'

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

// The shared look for the login and sign-up pages: one calm, centred card,
// inspired by hosted login screens like Clerk's.
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sky-100">
              <Droplet className="size-6 text-sky-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
        <p className="mt-6 text-center text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}
