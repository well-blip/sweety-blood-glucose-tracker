import { GLUCOSE_LEVELS, glucoseLevel, scalePosition } from '@/lib/glucose-scale'
import { cn } from '@/lib/utils'

type GlucoseScaleProps = {
  /** Where to put the marker. Leave out to show the scale on its own (as a legend). */
  value?: number | null
  /** Text inside the marker bubble, e.g. "Average 132.4". Defaults to the value. */
  markerLabel?: string
  className?: string
}

// A colour bar with the six levels (Low → Extremely high). With a value, a marker shows where it sits
// and the band it falls in stays bright while the others fade back. Colour is never the only signal:
// every band is labelled and the matching level is written out in words underneath.
export function GlucoseScale({ value, markerLabel, className }: GlucoseScaleProps) {
  const hasValue = typeof value === 'number' && Number.isFinite(value)
  const current = hasValue ? glucoseLevel(value) : null
  const position = hasValue ? scalePosition(value) : 0

  return (
    <div className={cn('grid gap-2', className)}>
      {/* Marker row: a small bubble with the value and a pointer down to the bar */}
      {hasValue && (
        <div className="relative h-9" aria-hidden="true">
          <div
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-500 ease-out"
            style={{ left: `clamp(2.5rem, ${position}%, calc(100% - 2.5rem))` }}
          >
            <span className="rounded-md bg-foreground px-2 py-0.5 text-sm font-semibold whitespace-nowrap text-background">
              {markerLabel ?? value}
            </span>
            <span className="size-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-foreground" />
          </div>
        </div>
      )}

      <div className="relative">
        <div className="grid grid-cols-6 gap-1">
          {GLUCOSE_LEVELS.map((level) => (
            <div
              key={level.id}
              className={cn(
                'h-3 transition-opacity duration-500 first:rounded-l-full last:rounded-r-full',
                current && current.id !== level.id && 'opacity-30',
              )}
              style={{ backgroundColor: level.color }}
            />
          ))}
        </div>
        {/* A thin line on the bar marking the exact spot */}
        {hasValue && (
          <span
            aria-hidden="true"
            className="absolute -top-1 h-5 w-[3px] -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background transition-[left] duration-500 ease-out"
            style={{ left: `${position}%` }}
          />
        )}
      </div>

      {/* Labels under each band, with the range in mg/dl */}
      <div className="grid grid-cols-6 gap-1">
        {GLUCOSE_LEVELS.map((level, index) => (
          <div
            key={level.id}
            className={cn(
              'grid gap-0.5 text-center leading-tight transition-opacity duration-500',
              current && current.id !== level.id && 'opacity-50',
            )}
          >
            <span className={cn('text-xs font-medium sm:text-sm', current?.id === level.id && 'font-semibold')}>
              {level.label}
            </span>
            <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
              {index === 0 ? `under ${level.max + 1}` : index === GLUCOSE_LEVELS.length - 1 ? `over ${level.min - 1}` : `${level.min}–${level.max}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// A small pill like "● Normal", tinted in the level's colour. Used next to values in lists and reports.
export function GlucoseBadge({ value, className }: { value: number; className?: string }) {
  const level = glucoseLevel(value)
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap', className)}
      style={{ backgroundColor: level.tint, color: level.text }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: level.color }} aria-hidden="true" />
      {level.label}
    </span>
  )
}
