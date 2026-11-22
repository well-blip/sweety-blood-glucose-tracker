// Dates are handled as 'YYYY-MM-DD' strings everywhere (the same format Postgres DATE uses).
// Strings in this format sort correctly, so '2026-10-15' < '2026-10-16' works as expected.

const DEFAULT_TIMEZONE = 'Asia/Kolkata'

// Today's date in the app's time zone (India by default), not the server's or UTC.
// Example: at 02:00 IST on 16 Oct, UTC is still 15 Oct, but for an Indian user "today" is 16 Oct.
export function todayInAppTimezone(now: Date = new Date()): string {
  const timeZone = process.env.APP_TIMEZONE || DEFAULT_TIMEZONE
  // The 'en-CA' locale formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export type ReportType = 'daily' | 'month-to-date' | 'monthly'

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// The date range each report covers, for a selected date (both ends included).
//   daily          15 Oct 2026 → 15 Oct – 15 Oct
//   month-to-date  15 Oct 2026 →  1 Oct – 15 Oct
//   monthly        15 Oct 2026 →  1 Sep – 30 Sep   (the whole PREVIOUS month)
// Works in UTC on purpose: these are calendar dates, so no time zone should shift them.
export function reportRange(type: ReportType, selectedDate: string): { from: string; to: string } {
  const [year, month] = selectedDate.split('-').map(Number) // month is 1–12

  if (type === 'daily') {
    return { from: selectedDate, to: selectedDate }
  }
  if (type === 'month-to-date') {
    return { from: toIso(new Date(Date.UTC(year, month - 1, 1))), to: selectedDate }
  }
  // Date.UTC(year, month - 2, 1) is the 1st of the previous month (JS months are 0–11,
  // and month -1 rolls back into December of the previous year automatically).
  // Day 0 of the current month is the last day of the previous month (28, 29, 30 or 31).
  return {
    from: toIso(new Date(Date.UTC(year, month - 2, 1))),
    to: toIso(new Date(Date.UTC(year, month - 1, 0))),
  }
}

// True only for real calendar dates like '2026-02-28' (rejects '2026-02-30' and '15/10/2026').
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}
