import type { ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { LogoMark } from '@/components/logo'

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

// The shared look for the login and sign-up pages, inspired by hosted login screens like Clerk's:
// a raised card with the form on a white panel and a quiet footer strip underneath.
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4 py-10 dark:bg-background">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border bg-muted shadow-xl shadow-black/5">
          <div className="rounded-b-2xl border-b bg-card px-8 pt-9 pb-8">
            <div className="mb-8 text-center">
              <LogoMark className="mx-auto mb-4 size-11" />
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
          <p className="flex items-center justify-center gap-2 px-8 py-4 text-sm text-muted-foreground">
            <LockKeyhole className="size-4" aria-hidden="true" />
            Your readings are private to you
          </p>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-muted-foreground">{footer}</div>
      </div>
    </div>
  )
}
