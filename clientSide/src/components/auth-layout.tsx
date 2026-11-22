import type { ReactNode } from 'react'
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

      <DayCurve />

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

// A decorative day of readings: four points on a soft curve, one per time slot.
function DayCurve() {
  const points = [
    { x: 40, y: 150, label: 'Morning', value: 95 },
    { x: 173, y: 70, label: 'Breakfast', value: 138 },
    { x: 307, y: 118, label: 'Lunch', value: 112 },
    { x: 440, y: 98, label: 'Dinner', value: 124 },
  ]
  return (
    <svg viewBox="0 0 480 220" className="w-full max-w-lg" aria-hidden="true">
      {[50, 100, 150].map((y) => (
        <line key={y} x1="20" x2="460" y1={y} y2={y} className="stroke-zinc-800" strokeDasharray="3 5" />
      ))}
      <path
        d="M40 150 C 95 150, 120 70, 173 70 S 260 118, 307 118 S 400 98, 440 98"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-rose-400"
      />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="6" className="fill-zinc-950 stroke-rose-400" strokeWidth="2.5" />
          <text x={p.x} y={p.y - 16} textAnchor="middle" className="fill-zinc-100 text-[13px] font-medium">
            {p.value}
          </text>
          <text x={p.x} y="200" textAnchor="middle" className="fill-zinc-500 text-[12px]">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
