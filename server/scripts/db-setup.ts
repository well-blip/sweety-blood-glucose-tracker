// Creates the tables in both the dev and the test database.
// Usage: npm run db:setup   (WARNING: drops existing tables first)
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const schemaPath = new URL('../db/schema.sql', import.meta.url)

const targets = [
  { name: 'dev', url: process.env.DATABASE_URL },
  { name: 'test', url: process.env.DATABASE_URL_TEST },
]

async function main() {
  const schema = await readFile(schemaPath, 'utf8')

  for (const target of targets) {
    if (!target.url) {
      throw new Error(`Missing connection string for the ${target.name} database. Check your .env file.`)
    }
    // A single client is enough for a one-off script; the app itself uses the pool.
    const client = new pg.Client({ connectionString: target.url })
    await client.connect()
    try {
      await client.query(schema)
      console.log(`✔ ${target.name} database is ready`)
    } finally {
      await client.end()
    }
  }
}

main().catch((error) => {
  console.error('Database setup failed:', error.message)
  process.exit(1)
})
