import { Redis } from 'ioredis'

// Tests use their own Redis database number (like they use their own Postgres database).
export const redisUrl = process.env.NODE_ENV === 'test' ? process.env.REDIS_URL_TEST : process.env.REDIS_URL

let client: Redis | null = null
let warned = false

// One shared Redis connection for the cache, created on first use. Returns null when REDIS_URL isn't set.
export function getRedis(): Redis | null {
  if (!redisUrl) return null
  if (!client) {
    client = new Redis(redisUrl, {
      // If Redis is down, fail straight away instead of queueing commands and making requests hang.
      // The cache then counts it as a miss and the API carries on using Postgres.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
    client.on('error', (error) => {
      if (!warned) console.warn(`Redis unavailable (${error.message}); reports will be served without the cache.`)
      warned = true
    })
    client.on('ready', () => {
      warned = false
    })
  }
  return client
}

// Resolves once the connection is open. Used by tests, so the first request doesn't count as a miss.
export async function redisReady(): Promise<Redis | null> {
  const redis = getRedis()
  if (redis && redis.status !== 'ready') await new Promise((resolve) => redis.once('ready', resolve))
  return redis
}

export async function closeRedis() {
  await client?.quit()
  client = null
}
