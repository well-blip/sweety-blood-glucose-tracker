// Creates a demo user with about 3 months of realistic readings, so the app has data to show.
// Usage: npm run seed   (safe to run again: it deletes and recreates only the demo user)
import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'
import { addDays, todayInAppTimezone } from '../src/utils/dates'
import { SLOTS, type Slot } from '../src/validation/reading.validation'

export const DEMO_USER = { name: 'Demo User', email: 'demo@sweety.app', password: 'sweety123' }
const DAYS = 90

// Typical values for each slot: fasting is lowest, after meals is higher.
const TYPICAL: Record<Slot, number> = {
  MORNING_FASTING: 112,
  AFTER_BREAKFAST: 150,
  AFTER_LUNCH: 158,
  AFTER_DINNER: 146,
}

// A tiny seeded random number generator (mulberry32). Same seed → same numbers every run,
// so the demo data (and the screenshots) look the same each time.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildReadings(today: string) {
  const random = seededRandom(42)
  const readings: { date: string; slot: Slot; value: number }[] = []

  for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
    const date = addDays(today, -daysAgo)
    // Levels improve slowly over the 3 months (about 15 mg/dl), so the trend chart tells a story.
    const improvement = ((DAYS - daysAgo) / DAYS) * 15

    for (const slot of SLOTS) {
      // Today only has the morning reading, so there is room to try adding one in the demo.
      if (daysAgo === 0 && slot !== 'MORNING_FASTING') continue
      // Real people miss a check now and then (about 1 in 8), but always keep today's.
      if (random() < 0.12 && daysAgo > 0) continue

      let value = TYPICAL[slot] + 8 - improvement + (random() - 0.5) * 40
      if (random() < 0.03) value += 70 // an occasional high after a heavy meal
      if (random() < 0.02) value = 62 + random() * 10 // an occasional low
      readings.push({ date, slot, value: Math.round(Math.min(600, Math.max(40, value))) })
    }
  }
  return readings
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.')

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    // One transaction: either the demo user and all their readings are created, or nothing is.
    await client.query('BEGIN')
    // Deleting the user also deletes their readings (ON DELETE CASCADE). Other users are untouched.
    await client.query('DELETE FROM users WHERE email = $1', [DEMO_USER.email])

    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10)
    const { rows } = await client.query<{ id: number }>(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [DEMO_USER.name, DEMO_USER.email, passwordHash],
    )
    const userId = rows[0].id

    const readings = buildReadings(todayInAppTimezone())
    // unnest() turns three arrays into rows, so all readings go in with a single INSERT.
    await client.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       SELECT $1, * FROM unnest($2::date[], $3::text[], $4::int[])`,
      [userId, readings.map((r) => r.date), readings.map((r) => r.slot), readings.map((r) => r.value)],
    )
    await client.query('COMMIT')

    console.log(`✔ Demo user ready with ${readings.length} readings over ${DAYS} days`)
    console.log(`  Email:    ${DEMO_USER.email}`)
    console.log(`  Password: ${DEMO_USER.password}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message)
  process.exit(1)
})
