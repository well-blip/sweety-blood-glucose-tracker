import pg from 'pg'

// Postgres type 1082 is DATE. By default `pg` turns it into a JS Date at local midnight,
// which can shift to the previous day when converted to UTC. We keep it as the plain
// 'YYYY-MM-DD' string Postgres sends, so a reading's date never moves.
pg.types.setTypeParser(1082, (value) => value)

// Tests run with NODE_ENV=test and use their own database, so they never touch real data.
const connectionString =
  process.env.NODE_ENV === 'test' ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL (or DATABASE_URL_TEST when testing) is not set. Copy .env.example to .env.')
}

// One pool for the whole app: it keeps a few connections open and reuses them.
export const pool = new pg.Pool({ connectionString })
