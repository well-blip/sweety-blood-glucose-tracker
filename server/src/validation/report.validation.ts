import { z } from 'zod'
import { isValidIsoDate } from '../utils/dates'
import { MESSAGES } from './reading.validation'

export const REPORT_TYPES = ['daily', 'month-to-date', 'monthly'] as const

// GET /reports?type=monthly&date=2026-10-15
export function reportQuerySchema(today: string) {
  return z.object({
    type: z.enum(REPORT_TYPES, { error: 'Choose a report: daily, month-to-date or monthly.' }),
    date: z
      .string({ error: MESSAGES.dateRequired })
      .refine(isValidIsoDate, MESSAGES.dateRequired)
      .refine((date) => date <= today, MESSAGES.futureDate),
  })
}

// GET /reports/trend?days=30 — the chart offers three ranges
export const TREND_RANGES = [7, 30, 90] as const
export const trendQuerySchema = z.object({
  days: z.coerce
    .number()
    .refine((n) => (TREND_RANGES as readonly number[]).includes(n), 'days must be 7, 30 or 90.')
    .default(30),
})

// POST /reports/email { type, date, doctorEmail }: the same report choice, plus where to send it
export function emailReportSchema(today: string) {
  return reportQuerySchema(today).extend({
    doctorEmail: z
      .string({ error: "Enter your doctor's email address." })
      .trim()
      .toLowerCase()
      .min(1, "Enter your doctor's email address.")
      .pipe(z.email('Enter a valid email address.')),
  })
}
