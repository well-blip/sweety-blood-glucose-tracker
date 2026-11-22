import { clearReportCache } from '../cache/report-cache'
import { pool } from '../db/pool'
import { AppError } from '../errors'
import { MESSAGES, SLOTS, type ReadingInput, type Slot } from '../validation/reading.validation'

export type Reading = { id: number; date: string; slot: Slot; value: number }

// Columns renamed to the names the API uses (reading_date → date).
const READING_COLUMNS = 'id, reading_date AS date, slot, value'

// Slots in the order they happen in a day; used to sort "newest first" within a date.
const SLOT_ORDER_SQL = `array_position(ARRAY['${SLOTS.join("','")}'], slot)`

// Check the per-day rules before writing. `excludeId` skips the reading being edited,
// so editing a reading doesn't count it against itself.
async function assertDayRules(userId: number, input: ReadingInput, excludeId: number | null) {
  const { rows } = await pool.query<{ slot: Slot }>(
    `SELECT slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, input.date, excludeId],
  )

  // The 4-per-day check comes first: on a full day every slot is taken, so checking
  // the slot first would always say "You already have…" and this message would never appear.
  if (rows.length >= 4) {
    throw new AppError(409, MESSAGES.maxPerDay, { date: MESSAGES.maxPerDay })
  }
  if (rows.some((row) => row.slot === input.slot)) {
    const message = MESSAGES.duplicateSlot(input.slot)
    throw new AppError(409, message, { slot: message })
  }
}

// If two requests for the same slot arrive at the same moment, both can pass the check above;
// the database's UNIQUE constraint then rejects the second one with code 23505.
function rethrowDuplicate(error: unknown, slot: Slot): never {
  if ((error as { code?: string }).code === '23505') {
    const message = MESSAGES.duplicateSlot(slot)
    throw new AppError(409, message, { slot: message })
  }
  throw error
}

export async function createReading(userId: number, input: ReadingInput): Promise<Reading> {
  await assertDayRules(userId, input, null)
  try {
    const { rows } = await pool.query<Reading>(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING ${READING_COLUMNS}`,
      [userId, input.date, input.slot, input.value],
    )
    await clearReportCache(userId) // the user's reports now include this reading
    return rows[0]
  } catch (error) {
    rethrowDuplicate(error, input.slot)
  }
}

export async function listReadings(userId: number, page: number, limit: number) {
  const offset = (page - 1) * limit

  // Two simple queries: one page of rows, and the total count for "Page 1 of 3".
  const [list, count] = await Promise.all([
    pool.query<Reading>(
      `SELECT ${READING_COLUMNS} FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    pool.query<{ total: number }>('SELECT COUNT(*)::int AS total FROM readings WHERE user_id = $1', [userId]),
  ])

  const total = count.rows[0].total
  return {
    readings: list.rows,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function updateReading(userId: number, readingId: number, input: ReadingInput): Promise<Reading> {
  await assertReadingExists(userId, readingId)
  await assertDayRules(userId, input, readingId)
  try {
    const { rows } = await pool.query<Reading>(
      `UPDATE readings
       SET reading_date = $3, slot = $4, value = $5, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING ${READING_COLUMNS}`,
      [readingId, userId, input.date, input.slot, input.value],
    )
    await clearReportCache(userId)
    return rows[0]
  } catch (error) {
    rethrowDuplicate(error, input.slot)
  }
}

export async function deleteReading(userId: number, readingId: number): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [readingId, userId])
  if (rowCount === 0) throw notFound()
  await clearReportCache(userId)
}

// Every query includes user_id, so another user's reading looks exactly like one that doesn't exist.
async function assertReadingExists(userId: number, readingId: number) {
  const { rowCount } = await pool.query('SELECT 1 FROM readings WHERE id = $1 AND user_id = $2', [readingId, userId])
  if (rowCount === 0) throw notFound()
}

function notFound() {
  return new AppError(404, 'Reading not found.')
}
