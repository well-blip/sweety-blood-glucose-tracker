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
