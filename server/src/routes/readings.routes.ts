import { Router, type Request } from 'express'
import { AppError, validationError } from '../errors'
import { requireAuth } from '../middleware/auth.middleware'
import { createReading, deleteReading, listReadings, updateReading } from '../services/readings.service'
import { todayInAppTimezone } from '../utils/dates'
import { paginationSchema, readingSchema } from '../validation/reading.validation'

export const readingsRouter = Router()

// Every readings endpoint needs a logged-in user
readingsRouter.use(requireAuth)

function parseReading(req: Request) {
  const parsed = readingSchema(todayInAppTimezone()).safeParse(req.body ?? {})
  if (!parsed.success) throw validationError(parsed.error)
  return parsed.data
}

// "/readings/abc" or "/readings/-1" can't be a real reading
function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) throw new AppError(404, 'Reading not found.')
  return id
}

// GET /readings?page=1&limit=20 → { readings, page, limit, total, totalPages }
readingsRouter.get('/', async (req, res) => {
  const parsed = paginationSchema.safeParse(req.query)
  if (!parsed.success) throw validationError(parsed.error)

  res.json(await listReadings(req.userId!, parsed.data.page, parsed.data.limit))
})

// POST /readings  { date, slot, value } → 201 { reading }
readingsRouter.post('/', async (req, res) => {
  const reading = await createReading(req.userId!, parseReading(req))
  res.status(201).json({ reading })
})

// PUT /readings/:id  { date, slot, value } → 200 { reading }
readingsRouter.put('/:id', async (req, res) => {
  const reading = await updateReading(req.userId!, parseId(req), parseReading(req))
  res.json({ reading })
})

// DELETE /readings/:id → 204 (no body)
readingsRouter.delete('/:id', async (req, res) => {
  await deleteReading(req.userId!, parseId(req))
  res.status(204).end()
})
