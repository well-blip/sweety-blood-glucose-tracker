import 'dotenv/config'
import { afterAll, beforeEach } from 'vitest'
import { closeRedis, redisReady } from '../src/cache/redis'
import { pool } from '../src/db/pool'
import { closeReportEmailQueue } from '../src/jobs/report-email.queue'

// Start every test with empty tables, so tests can't affect each other.
beforeEach(async () => {
  await pool.query('TRUNCATE users, readings RESTART IDENTITY CASCADE')
  // Empty the test Redis database too (cached reports and queued jobs)
  await (await redisReady())?.flushdb()
})

afterAll(async () => {
  await pool.end()
  await closeRedis()
  await closeReportEmailQueue()
})
