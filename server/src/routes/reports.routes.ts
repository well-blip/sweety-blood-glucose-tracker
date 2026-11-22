import { Router, type Response } from 'express'
import { cachedReport } from '../cache/report-cache'
import { validationError } from '../errors'
import { requireAuth } from '../middleware/auth.middleware'
import { enqueueReportEmail, getReportEmailStatus } from '../jobs/report-email.queue'
import { getReport, getTrend } from '../services/reports.service'
import { todayInAppTimezone } from '../utils/dates'
import { emailReportSchema, reportQuerySchema, trendQuerySchema } from '../validation/report.validation'

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

// POST /reports/email { type, date, doctorEmail } → 202 { jobId, status: 'queued' }
// 202 Accepted = "got it, working on it": the PDF is built and emailed by the background worker.
reportsRouter.post('/email', async (req, res) => {
  const parsed = emailReportSchema(todayInAppTimezone()).safeParse(req.body ?? {})
  if (!parsed.success) throw validationError(parsed.error)

  const jobId = await enqueueReportEmail({ userId: req.userId!, ...parsed.data })
  res.status(202).json({ jobId, status: 'queued' })
})

// GET /reports/email/:jobId → { status: 'queued' | 'sending' | 'sent' | 'failed', sentTo }
// The client asks every second or so until the status is 'sent' or 'failed'.
reportsRouter.get('/email/:jobId', async (req, res) => {
  res.json(await getReportEmailStatus(String(req.params.jobId), req.userId!))
})
