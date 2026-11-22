import { describe, expect, it } from 'vitest'
import { isValidIsoDate, todayInAppTimezone } from '../src/utils/dates'
import { MESSAGES, readingSchema } from '../src/validation/reading.validation'

// A fixed "today" makes these tests independent of when they run.
const TODAY = '2026-10-15'
const schema = readingSchema(TODAY)
const valid = { date: '2026-10-15', slot: 'AFTER_LUNCH', value: 120 }

function errorsFor(input: unknown) {
  const result = schema.safeParse(input)
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]))
}

describe('reading validation', () => {
  it('accepts a valid reading, including the boundary values 40 and 600', () => {
    expect(schema.safeParse(valid).success).toBe(true)
    expect(schema.safeParse({ ...valid, value: 40 }).success).toBe(true)
    expect(schema.safeParse({ ...valid, value: 600 }).success).toBe(true)
  })

  it('accepts the value as a numeric string from a form', () => {
    const result = schema.safeParse({ ...valid, value: ' 120 ' })
    expect(result.success && result.data.value).toBe(120)
  })

  it.each([undefined, null, '', '   '])('requires a value (%j)', (value) => {
    expect(errorsFor({ ...valid, value }).value).toBe(MESSAGES.valueRequired)
  })

  it.each([39, 601, 120.5, '12.5', 'abc', -5, 0])('rejects %j as out of range / not a whole number', (value) => {
    expect(errorsFor({ ...valid, value }).value).toBe('Value must be between 40 and 600 mg/dl.')
  })

  it('rejects a future date but allows today', () => {
    expect(errorsFor({ ...valid, date: '2026-10-16' }).date).toBe('Date cannot be in the future.')
    expect(schema.safeParse({ ...valid, date: TODAY }).success).toBe(true)
  })

  it('rejects impossible or badly formatted dates', () => {
    expect(errorsFor({ ...valid, date: '2026-02-30' }).date).toBe(MESSAGES.dateRequired)
    expect(errorsFor({ ...valid, date: '15/10/2026' }).date).toBe(MESSAGES.dateRequired)
  })

  it('rejects an unknown slot', () => {
    expect(errorsFor({ ...valid, slot: 'LUNCH' }).slot).toBe(MESSAGES.slotRequired)
  })

  it('builds the duplicate-slot message with the slot name', () => {
    expect(MESSAGES.duplicateSlot('AFTER_LUNCH')).toBe('You already have an After lunch reading for this date.')
  })
})

describe('dates', () => {
  it('works out "today" in India time, not UTC', () => {
    // 20:00 UTC on 15 Oct is 01:30 on 16 Oct in India
    expect(todayInAppTimezone(new Date('2026-10-15T20:00:00Z'))).toBe('2026-10-16')
  })

  it('recognises real calendar dates only', () => {
    expect(isValidIsoDate('2028-02-29')).toBe(true) // leap year
    expect(isValidIsoDate('2026-02-29')).toBe(false)
  })
})
