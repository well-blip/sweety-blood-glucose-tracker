import { api } from '@/lib/api'
import { SLOTS, type SlotId } from '@/lib/slots'

// ---------- Types matching the API ----------

export type Reading = { id: number; date: string; slot: SlotId; value: number }
export type ReadingInput = { date: string; slot: SlotId; value: string }

export type ReadingsPage = { readings: Reading[]; page: number; limit: number; total: number; totalPages: number }

export type ReportType = 'daily' | 'month-to-date' | 'monthly'
export type ReportSummary = { highest: number | null; lowest: number | null; average: number | null; count: number }
export type Report = { type: ReportType; from: string; to: string; summary: ReportSummary; readings: Reading[] }

export type TrendDay = { date: string; average: number; lowest: number; highest: number; count: number }
export type Trend = { from: string; to: string; days: TrendDay[] }

// ---------- Kenpath's exact messages ----------
// The server is the real gatekeeper and returns these same messages; checking in the browser
// first just shows them instantly. (With more time these would live in one shared package.)

export const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: 'Value must be between 40 and 600 mg/dl.',
  futureDate: 'Date cannot be in the future.',
  dateRequired: 'Choose a valid date.',
}

export function slotLabel(slot: SlotId): string {
  return SLOTS.find((s) => s.id === slot)?.label ?? slot
}

// Checks what can be checked without the database. "One per slot" and "4 per day"
// need the user's other readings, so only the server can decide those.
export function validateReading(input: ReadingInput, today: string): Record<string, string> {
  const errors: Record<string, string> = {}
  const value = input.value.trim()

  if (value === '') errors.value = MESSAGES.valueRequired
  else if (!/^\d+$/.test(value) || Number(value) < 40 || Number(value) > 600) errors.value = MESSAGES.valueRange

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = MESSAGES.dateRequired
  else if (input.date > today) errors.date = MESSAGES.futureDate

  return errors
}

// ---------- Dates ----------

// Today as YYYY-MM-DD in the browser's local time zone.
// (toISOString() would use UTC, which is still "yesterday" in India before 05:30.)
export function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// '2026-10-15' → '15 Oct 2026'. Formatted in UTC so the date never shifts by a day.
export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

// ---------- API calls ----------

const toBody = (input: ReadingInput) => ({ date: input.date, slot: input.slot, value: input.value.trim() })

export const readingsApi = {
  list: (page: number, limit = 10) => api<ReadingsPage>(`/readings?page=${page}&limit=${limit}`),
  create: (input: ReadingInput) => api<{ reading: Reading }>('/readings', { method: 'POST', body: toBody(input) }),
  update: (id: number, input: ReadingInput) =>
    api<{ reading: Reading }>(`/readings/${id}`, { method: 'PUT', body: toBody(input) }),
  remove: (id: number) => api<void>(`/readings/${id}`, { method: 'DELETE' }),
  report: (type: ReportType, date: string) => api<Report>(`/reports?type=${type}&date=${date}`),
  trend: (days: 7 | 30 | 90) => api<Trend>(`/reports/trend?days=${days}`),
}
