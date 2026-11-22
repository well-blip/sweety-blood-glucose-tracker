import { cn } from '@/lib/utils'

// The Sweety mark, drawn like an app icon: a dark rounded square holding a hexagon
// (chemistry draws the glucose molecule as a six-sided ring) with a drop of blood inside —
// "glucose in the blood", i.e. blood sugar.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8 shrink-0', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-zinc-900 dark:fill-zinc-100" />
      <path
        d="M16 5.5 25.1 10.75v10.5L16 26.5 6.9 21.25v-10.5Z"
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className="stroke-white/85 dark:stroke-zinc-900/85"
      />
      <path d="M16 10.4s-4.1 4.75-4.1 7.6a4.1 4.1 0 0 0 8.2 0c0-2.85-4.1-7.6-4.1-7.6Z" fill="#f43f5e" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight', className)}>
      <LogoMark className="size-7" />
      Sweety
    </span>
  )
}
