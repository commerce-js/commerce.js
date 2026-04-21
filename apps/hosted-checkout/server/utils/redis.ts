// ---------------------------------------------------------------------------
// Redis connection for BullMQ (hosted-checkout producer-only mirror)
// ---------------------------------------------------------------------------
//
// Mirrors apps/dashboard/server/utils/redis.ts — same resolveRedisUrl
// semantics and same ioredis options. Hosted-checkout uses this only to
// ENQUEUE jobs into the shared `merchant-jobs` queue (the dashboard's
// worker process is the sole consumer). Keeping a local copy avoids
// adding a cross-app import; the three-file surface (redis.ts, queue.ts,
// package.json) is small enough that copy-local beats a new internal
// workspace package.
// ---------------------------------------------------------------------------

import process from 'node:process'
import IORedis from 'ioredis'
import type { RedisOptions } from 'ioredis'

export function resolveRedisUrl(): string {
  const explicit = process.env.REDIS_URL
  if (explicit) return explicit

  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (restUrl && token) {
    const host = restUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    return `rediss://default:${token}@${host}:6379`
  }

  throw new Error(
    '[hosted-checkout] No Redis connection info found. Set REDIS_URL '
    + '(preferred) or both UPSTASH_REDIS_REST_URL and '
    + 'UPSTASH_REDIS_REST_TOKEN as Fly secrets.',
  )
}

export function redisConnectionOptions(overrides: RedisOptions = {}): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    ...overrides,
  }
}

export function createRedisConnection(overrides: RedisOptions = {}): IORedis {
  return new IORedis(resolveRedisUrl(), redisConnectionOptions(overrides))
}
