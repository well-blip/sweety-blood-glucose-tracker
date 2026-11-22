import type { ReactNode } from 'react'
import { CheckAndLog } from '@/components/check-and-log'
import { Logo, LogoMark } from '@/components/logo'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

// Split-screen auth page (like shadcn's authentication example):
// a dark brand panel on the left (desktop only) and a clean, centred form on the right.
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <BrandPanel />

      <div className="relative flex flex-col px-6 py-6 sm:px-10">
        {/* On phones the brand panel is hidden, so show the logo above the form instead */}
        <Logo className="lg:hidden" />

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 grid gap-2">
              <h1 className="text-3xl font-semibold">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            <p className="mt-8 border-t pt-6 text-muted-foreground">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex">
      <span className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <LogoMark className="size-7" tone="light" motion="loop" />
        Sweety
      </span>

      <CheckAndLog />

      <figure className="grid gap-3">
        <blockquote className="text-2xl leading-snug font-medium tracking-tight text-balance">
          “Four quick checks a day. One clear picture of how you’re doing.”
        </blockquote>
        <figcaption className="text-sm text-zinc-400">
          Morning (fasting) · After breakfast · After lunch · After dinner
        </figcaption>
      </figure>
    </aside>
  )
}
