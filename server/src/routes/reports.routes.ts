import { Router, type Response } from 'express'
import { cachedReport } from '../cache/report-cache'
import { validationError } from '../errors'
import { requireAuth } from '../middleware/auth.middleware'
import { getReport, getTrend } from '../services/reports.service'
import { todayInAppTimezone } from '../utils/dates'
import { reportQuerySchema, trendQuerySchema } from '../validation/report.validation'

export const reportsRouter = Router()

// "X-Cache: HIT" means the answer came from Redis; "MISS" means it was worked out in Postgres.
// Handy for checking the cache in the browser's Network tab or with curl -i.
function sendCached<T>(res: Response, result: { value: T; hit: boolean }) {
  res.set('X-Cache', result.hit ? 'HIT' : 'MISS').json(result.value)
}

reportsRouter.use(requireAuth)

// GET /reports?type=daily|month-to-date|monthly&date=YYYY-MM-DD
// → { type, from, to, summary: { highest, lowest, average, count }, readings }
reportsRouter.get('/', async (req, res) => {
  const parsed = reportQuerySchema(todayInAppTimezone()).safeParse(req.query)
  if (!parsed.success) throw validationError(parsed.error)

  const { type, date } = parsed.data
  const userId = req.userId!
  sendCached(res, await cachedReport(userId, `report:${type}:${date}`, () => getReport(userId, type, date)))
})

// GET /reports/trend?days=7|30|90 → { from, to, days: [{ date, average, lowest, highest, count }] }
reportsRouter.get('/trend', async (req, res) => {
  const parsed = trendQuerySchema.safeParse(req.query)
  if (!parsed.success) throw validationError(parsed.error)

  const { days } = parsed.data
  const userId = req.userId!
  const today = todayInAppTimezone()
  // "today" is part of the key: tomorrow the same 30-day chart covers different dates
  sendCached(res, await cachedReport(userId, `trend:${days}:${today}`, () => getTrend(userId, days, today)))
})
