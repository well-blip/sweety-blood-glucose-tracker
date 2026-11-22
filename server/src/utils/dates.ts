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

// True only for real calendar dates like '2026-02-28' (rejects '2026-02-30' and '15/10/2026').
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}
