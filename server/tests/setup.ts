import 'dotenv/config'
import { afterAll, beforeEach } from 'vitest'
import { pool } from '../src/db/pool'

// Start every test with empty tables, so tests can't affect each other.
beforeEach(async () => {
  await pool.query('TRUNCATE users, readings RESTART IDENTITY CASCADE')
})

afterAll(async () => {
  await pool.end()
})
