import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SlotScene } from '@/components/slot-scene'
import { SLOTS, slotForHour, type SlotId } from '@/lib/slots'
import { cn } from '@/lib/utils'

// Today's date as YYYY-MM-DD in the browser's local time zone.
// (toISOString() would use UTC, which is still "yesterday" in India before 05:30.)
function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function AddReadingCard() {
  // Lazy initial state: the function runs once on first render, not on every render.
  const [slotId, setSlotId] = useState<SlotId>(() => slotForHour(new Date().getHours()))
  const [wasAutoPicked, setWasAutoPicked] = useState(true)
  const [date, setDate] = useState(todayLocal)
  const [value, setValue] = useState('')

  const activeScene = SLOTS.find((s) => s.id === slotId)?.scene

  function chooseSlot(id: SlotId) {
    setSlotId(id)
    setWasAutoPicked(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Not connected yet: validation and the API call come in a later step.
  }

  return (
    <section
      data-scene={activeScene}
      className="overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <SlotScene slotId={slotId} />

      {/* noValidate: we'll show Kenpath's exact error messages ourselves instead of the browser's popups */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-medium">Add a reading</h2>
          {wasAutoPicked && (
            <span className="text-xs text-muted-foreground">Pre-selected from your current time</span>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm text-muted-foreground">Time slot</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SLOTS.map((slot) => {
              const isActive = slot.id === slotId
              const Icon = slot.icon
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => chooseSlot(slot.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-sm transition-colors duration-500 hover:bg-muted',
                    isActive && 'border-(--slot-accent) font-medium',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 transition-colors duration-500',
                      isActive ? 'text-(--slot-accent)' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                  {slot.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="reading-date">Date</Label>
            <Input
              id="reading-date"
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading-value">Value</Label>
            <div className="relative">
              <Input
                id="reading-value"
                inputMode="numeric"
                placeholder="110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pr-14"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                mg/dl
              </span>
            </div>
          </div>

          <Button type="submit">Add reading</Button>
        </div>

        <p className="text-xs text-muted-foreground">Whole number between 40 and 600.</p>
      </form>
    </section>
  )
}
