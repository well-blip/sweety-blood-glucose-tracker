import { pool } from '../db/pool'
import { addDays, reportRange, type ReportType } from '../utils/dates'
import { SLOTS } from '../validation/reading.validation'
import type { Reading } from './readings.service'

export type ReportSummary = {
  highest: number | null
  lowest: number | null
  average: number | null // rounded to 1 decimal place
  count: number
}

export type Report = {
  type: ReportType
  from: string
  to: string
  summary: ReportSummary
  // Every reading in the range, oldest first. The daily view lists them; the chart plots them.
  readings: Reading[]
}

export async function getReport(userId: number, type: ReportType, selectedDate: string): Promise<Report> {
  const { from, to } = reportRange(type, selectedDate)

  const [summary, readings] = await Promise.all([
    // Postgres does the maths. With no rows, MAX/MIN/AVG return NULL and COUNT returns 0,
    // which is exactly what the client needs to show the empty state.
    // ROUND(AVG(value), 1) rounds to 1 decimal; ::float turns Postgres's NUMERIC into a JS number.
    pool.query<ReportSummary>(
      `SELECT MAX(value)                  AS highest,
              MIN(value)                  AS lowest,
              ROUND(AVG(value), 1)::float AS average,
              COUNT(*)::int               AS count
       FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
      [userId, from, to],
    ),
    pool.query<Reading>(
      `SELECT id, reading_date AS date, slot, value
       FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date, array_position(ARRAY['${SLOTS.join("','")}'], slot)`,
      [userId, from, to],
    ),
  ])

  return { type, from, to, summary: summary.rows[0], readings: readings.rows }
}

export type TrendDay = { date: string; average: number; lowest: number; highest: number; count: number }

// One point per day that has readings, for the last `days` days up to today (inclusive).
// Used by the chart on the Readings page.
export async function getTrend(userId: number, days: number, today: string) {
  const from = addDays(today, -(days - 1))
  const { rows } = await pool.query<TrendDay>(
    `SELECT reading_date                AS date,
            ROUND(AVG(value), 1)::float AS average,
            MIN(value)                  AS lowest,
            MAX(value)                  AS highest,
            COUNT(*)::int               AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     GROUP BY reading_date
     ORDER BY reading_date`,
    [userId, from, today],
  )
  return { from, to: today, days: rows }
}
