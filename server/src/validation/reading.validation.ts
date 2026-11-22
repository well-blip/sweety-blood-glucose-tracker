import { z } from 'zod'
import { isValidIsoDate } from '../utils/dates'

export const SLOTS = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'] as const
export type Slot = (typeof SLOTS)[number]

// What users see for each slot (used in the "You already have…" message).
export const SLOT_LABELS: Record<Slot, string> = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
}

// Kenpath's exact error messages. Tests check these word for word.
export const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: 'Value must be between 40 and 600 mg/dl.',
  futureDate: 'Date cannot be in the future.',
  maxPerDay: 'You can add only 4 readings per day.',
  duplicateSlot: (slot: Slot) => `You already have an ${SLOT_LABELS[slot]} reading for this date.`,
  // Not specified by Kenpath, so kept short and plain:
  dateRequired: 'Choose a valid date.',
  slotRequired: 'Choose a time slot.',
}

// The value may arrive as a number (120) or a string from a form ("120", " 120 ", "").
// Empty → undefined (so we can say "required"); anything else → a number (NaN if not numeric).
function toNumberOrUndefined(input: unknown): unknown {
  if (input === undefined || input === null) return undefined
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed === '' ? undefined : Number(trimmed)
  }
  return input
}

// `today` is passed in (instead of read inside) so the rule is easy to test with any date.
export function readingSchema(today: string) {
  return z.object({
    date: z
      .string({ error: MESSAGES.dateRequired })
      .refine(isValidIsoDate, MESSAGES.dateRequired)
      .refine((date) => date <= today, MESSAGES.futureDate),
    slot: z.enum(SLOTS, { error: MESSAGES.slotRequired }),
    value: z.preprocess(
      toNumberOrUndefined,
      z
        .number({ error: (issue) => (issue.input === undefined ? MESSAGES.valueRequired : MESSAGES.valueRange) })
        .int(MESSAGES.valueRange) // 120.5 is not a whole number
        .min(40, MESSAGES.valueRange)
        .max(600, MESSAGES.valueRange),
    ),
  })
}

export type ReadingInput = z.infer<ReturnType<typeof readingSchema>>

// ?page=1&limit=20 — both optional; limit is capped so nobody can request a million rows.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'page must be 1 or more.').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'limit must be between 1 and 100.').default(20),
})
