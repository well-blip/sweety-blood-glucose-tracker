import { Router } from 'express'
import { validationError } from '../errors'
import { requireAuth } from '../middleware/auth.middleware'
import { getReport, getTrend } from '../services/reports.service'
import { todayInAppTimezone } from '../utils/dates'
import { reportQuerySchema, trendQuerySchema } from '../validation/report.validation'

export const reportsRouter = Router()

reportsRouter.use(requireAuth)

// GET /reports?type=daily|month-to-date|monthly&date=YYYY-MM-DD
// → { type, from, to, summary: { highest, lowest, average, count }, readings }
reportsRouter.get('/', async (req, res) => {
  const parsed = reportQuerySchema(todayInAppTimezone()).safeParse(req.query)
  if (!parsed.success) throw validationError(parsed.error)

  res.json(await getReport(req.userId!, parsed.data.type, parsed.data.date))
})

// GET /reports/trend?days=7|30|90 → { from, to, days: [{ date, average, lowest, highest, count }] }
reportsRouter.get('/trend', async (req, res) => {
  const parsed = trendQuerySchema.safeParse(req.query)
  if (!parsed.success) throw validationError(parsed.error)

  res.json(await getTrend(req.userId!, parsed.data.days, todayInAppTimezone()))
})
