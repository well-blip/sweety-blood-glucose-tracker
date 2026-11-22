import { cn } from '@/lib/utils'

// The Sweety mark: a hexagon for the glucose molecule (glucose is drawn in chemistry as a
// six-sided ring) with a drop of blood inside it — "glucose in the blood", i.e. blood sugar.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <path
        d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 8.5c0 0-5.25 6.1-5.25 9.75a5.25 5.25 0 0 0 10.5 0C21.25 14.6 16 8.5 16 8.5Z" fill="#e11d48" />
      <path d="M13.6 18.4a2.6 2.6 0 0 0 2 2.5" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xl font-semibold tracking-tight', className)}>
      <LogoMark />
      Sweety
    </span>
  )
}
