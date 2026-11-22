import { cn } from '@/lib/utils'
import './logo.css'

type LogoMarkProps = {
  className?: string
  // 'intro' plays once when the logo appears; 'loop' keeps a soft pulse going afterwards
  motion?: 'none' | 'intro' | 'loop'
  // 'light' = white tile, for dark backgrounds like the login brand panel
  tone?: 'dark' | 'light'
}

// The Sweety mark, drawn like an app icon: a rounded tile holding a hexagon
// (chemistry draws the glucose molecule as a six-sided ring) with a drop of blood inside —
// "glucose in the blood", i.e. blood sugar.
export function LogoMark({ className, motion = 'none', tone = 'dark' }: LogoMarkProps) {
  const light = tone === 'light'
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn(
        'size-8 shrink-0 overflow-visible',
        motion !== 'none' && 'logo-motion',
        motion === 'loop' && 'logo-motion-loop',
        className,
      )}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" className={light ? 'fill-zinc-50' : 'fill-zinc-900'} />
      <path
        className={cn('logo-ring', light ? 'stroke-zinc-900/85' : 'stroke-white/85')}
        d="M16 5.5 25.1 10.75v10.5L16 26.5 6.9 21.25v-10.5Z"
        pathLength={1}
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle className="logo-ripple" cx="16" cy="18.2" r="4.2" fill="none" stroke="#f43f5e" strokeWidth="1" />
      <path
        className="logo-drop"
        d="M16 10.4s-4.1 4.75-4.1 7.6a4.1 4.1 0 0 0 8.2 0c0-2.85-4.1-7.6-4.1-7.6Z"
        fill="#f43f5e"
      />
    </svg>
  )
}

// Logo mark + wordmark. In the header it animates once on load and bounces on hover.
export function Logo({ className, motion = 'intro' }: { className?: string; motion?: LogoMarkProps['motion'] }) {
  return (
    <span className={cn('logo-hover inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight', className)}>
      <LogoMark className="size-7" motion={motion} />
      Sweety
    </span>
  )
}
