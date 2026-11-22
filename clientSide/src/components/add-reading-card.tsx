import { useState, type FormEvent } from 'react'
import { CircleCheck } from 'lucide-react'
import { GlucoseScale } from '@/components/glucose-scale'
import { SlotScene } from '@/components/slot-scene'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { glucoseLevel } from '@/lib/glucose-scale'
import { readingsApi, todayLocal, validateReading, type Reading } from '@/lib/readings'
import { SLOTS, slotForHour, type SlotId } from '@/lib/slots'
import { cn } from '@/lib/utils'

type AddReadingCardProps = {
  // When set, the card edits this reading instead of adding a new one.
  // The parent gives the card a new `key` when this changes, so the form starts fresh.
  editing?: Reading | null
  onSaved: (reading: Reading) => void
  onCancelEdit?: () => void
}

export function AddReadingCard({ editing = null, onSaved, onCancelEdit }: AddReadingCardProps) {
  const isEditing = editing !== null
  // Lazy initial state: these functions run once when the card appears, not on every render.
  const [slotId, setSlotId] = useState<SlotId>(() => editing?.slot ?? slotForHour(new Date().getHours()))
  const [wasAutoPicked, setWasAutoPicked] = useState(!isEditing)
  const [date, setDate] = useState(() => editing?.date ?? todayLocal())
  const [value, setValue] = useState(() => (editing ? String(editing.value) : ''))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const activeScene = SLOTS.find((s) => s.id === slotId)?.scene
  // While typing, show where the number sits on the colour scale (only once it's a valid reading).
  const typedValue = /^\d+$/.test(value.trim()) ? Number(value.trim()) : null
  const preview = typedValue !== null && typedValue >= 40 && typedValue <= 600 ? typedValue : null
  const previewLevel = preview !== null ? glucoseLevel(preview) : null

  function chooseSlot(id: SlotId) {
    setSlotId(id)
    setWasAutoPicked(false)
    setErrors((current) => ({ ...current, slot: '' }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSavedMessage('')

    // 1. Check in the browser first, so mistakes show instantly with Kenpath's messages
    const input = { date, slot: slotId, value }
    const clientErrors = validateReading(input, todayLocal())
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    // 2. Send to the server, which checks everything again plus "one per slot" and "4 per day"
    setSaving(true)
    try {
      const { reading } = isEditing ? await readingsApi.update(editing.id, input) : await readingsApi.create(input)
      onSaved(reading)
      if (!isEditing) {
        setValue('')
        setSavedMessage('Reading saved.')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields)
        if (Object.keys(error.fields).length === 0) setFormError(error.message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section data-scene={activeScene} className="overflow-hidden rounded-xl border bg-card shadow-card">
      <SlotScene slotId={slotId} />

      {/* noValidate: we show Kenpath's exact messages ourselves instead of the browser's popups */}
      <form onSubmit={handleSubmit} noValidate className="grid gap-5 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{isEditing ? 'Edit reading' : 'Add a reading'}</h2>
          {wasAutoPicked && <span className="text-sm text-muted-foreground">Time slot chosen from the current time</span>}
        </div>

        {formError && (
          <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive">
            {formError}
          </p>
        )}

        <fieldset className="grid gap-2">
          <legend className="mb-2 font-medium">Time slot</legend>
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
                    'flex flex-col items-center gap-1.5 rounded-md border bg-background px-2 py-3 transition-colors duration-500 hover:bg-muted',
                    isActive && 'border-(--slot-accent) font-medium shadow-xs',
                  )}
                >
                  <Icon
                    className={cn('size-5 transition-colors duration-500', isActive ? 'text-(--slot-accent)' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  {slot.label}
                </button>
              )
            })}
          </div>
          {errors.slot && <p className="text-sm text-destructive">{errors.slot}</p>}
        </fieldset>

        <div className="grid items-start gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-2">
            <Label htmlFor="reading-date" className="font-medium">
              Date
            </Label>
            <Input
              id="reading-date"
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={errors.date ? true : undefined}
              className="h-11 text-base md:text-base"
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reading-value" className="font-medium">
              Value
            </Label>
            <div className="relative">
              <Input
                id="reading-value"
                inputMode="numeric"
                placeholder="110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={errors.value ? true : undefined}
                aria-describedby="reading-value-message"
                className="h-11 pr-16 text-base md:text-base"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                mg/dl
              </span>
            </div>
            <p id="reading-value-message" className={cn('text-sm', errors.value ? 'text-destructive' : 'text-muted-foreground')}>
              {errors.value || 'Whole number between 40 and 600.'}
            </p>
          </div>

          <div className="flex gap-2 sm:pt-[1.85rem]">
            {isEditing && (
              <Button type="button" variant="outline" className="h-11 px-4 text-base" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving} className="h-11 px-5 text-base">
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add reading'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-md border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {previewLevel ? (
              <>
                <span className="font-semibold text-foreground">{preview} mg/dl is {previewLevel.label.toLowerCase()}.</span>{' '}
                {previewLevel.meaning}
              </>
            ) : (
              'Type a value to see where it sits on the scale.'
            )}
          </p>
          <GlucoseScale value={preview} markerLabel={preview !== null ? String(preview) : undefined} />
        </div>

        {savedMessage && (
          <p role="status" className="flex items-center gap-2 text-emerald-700">
            <CircleCheck className="size-5" aria-hidden="true" />
            {savedMessage}
          </p>
        )}
      </form>
    </section>
  )
}
