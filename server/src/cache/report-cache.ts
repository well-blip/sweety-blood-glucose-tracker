import { getRedis } from './redis'

// Report results are cached in Redis for an hour, so repeated views don't re-run the SQL.
//
// Clearing the cache when a reading changes uses a "version number" per user instead of deleting keys:
//   reports:version:7        → 3
//   reports:7:v3:monthly:…   → the cached JSON
// Adding, editing or deleting a reading bumps the version to 4, so every old key is simply never
// read again (and Redis removes it when its hour is up). One INCR clears all of a user's reports,
// with no need to search for and delete keys one by one.
const TTL_SECONDS = 60 * 60

const versionKey = (userId: number) => `reports:version:${userId}`

export async function cachedReport<T>(
  userId: number,
  name: string,
  load: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
  const redis = getRedis()
  let key: string | null = null

  if (redis) {
    try {
      const version = (await redis.get(versionKey(userId))) ?? '0'
      key = `reports:${userId}:v${version}:${name}`
      const cached = await redis.get(key)
      if (cached) return { value: JSON.parse(cached) as T, hit: true }
    } catch {
      key = null // Redis is down: behave as if there were no cache
    }
  }

  const value = await load()
  if (redis && key) {
    // Don't make the user wait for the cache write, and ignore it if it fails.
    redis.set(key, JSON.stringify(value), 'EX', TTL_SECONDS).catch(() => {})
  }
  return { value, hit: false }
}

// Called after a reading is added, edited or deleted.
export async function clearReportCache(userId: number): Promise<void> {
  try {
    await getRedis()?.incr(versionKey(userId))
  } catch {
    // Redis is down, so nothing was cached either.
  }
}
