// ---------------------------------------------------------------------------
// Redis connection for BullMQ — shared between the web process (enqueuers)
// and the worker process (consumers).
// ---------------------------------------------------------------------------
//
// Upstash is the target Redis provider. The monorepo-root `.secrets` file
// exposes two URLs:
//
//   - UPSTASH_REDIS_REST_URL   → HTTPS-only, used by @upstash/redis / REST.
//                                BullMQ cannot use this (needs TCP).
//   - REDIS_URL                → rediss:// TCP URL from the Upstash console
//                                (Databases → Details → "TLS (rediss://)").
//
// BullMQ uses ioredis, which needs a standard Redis TCP connection. If
// `REDIS_URL` is set, we use it directly. Otherwise we derive a TCP URL
// from the REST URL + token (both Upstash endpoints accept the same
// password, and TCP is on port 6379 via TLS).
//
// Note the `maxRetriesPerRequest: null` option — BullMQ's Worker requires
// it so that blocking commands (like BRPOPLPUSH) don't retry indefinitely.
// ---------------------------------------------------------------------------

import process from 'node:process'
import IORedis from 'ioredis'
import type { RedisOptions } from 'ioredis'

/** Resolve the Redis URL, preferring REDIS_URL over a derived Upstash URL. */
export function resolveRedisUrl(): string {
  const explicit = process.env.REDIS_URL
  if (explicit) return explicit

  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (restUrl && token) {
    // Strip protocol + any trailing slash, then build the rediss:// URL.
    const host = restUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    return `rediss://default:${token}@${host}:6379`
  }

  throw new Error(
    'No Redis connection info found. Set REDIS_URL (preferred) or both '
    + 'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the '
    + 'monorepo-root .secrets file / Fly.io secrets.',
  )
}

/** Build ioredis connection options shared by Queue + Worker instances. */
export function redisConnectionOptions(overrides: RedisOptions = {}): RedisOptions {
  return {
    // BullMQ requirement: keep pending commands from retrying forever.
    maxRetriesPerRequest: null,
    // Upstash drops idle TCP connections aggressively; re-establish on demand.
    enableReadyCheck: false,
    lazyConnect: true,
    ...overrides,
  }
}

/**
 * Create a fresh IORedis connection using the resolved URL. Callers are
 * responsible for lifecycle (`await connection.quit()` on shutdown). In
 * practice, pass one connection to the Queue and one to the Worker — do
 * NOT share a single IORedis instance between roles (BullMQ docs are clear
 * that Worker connections run blocking commands).
 */
export function createRedisConnection(overrides: RedisOptions = {}): IORedis {
  return new IORedis(resolveRedisUrl(), redisConnectionOptions(overrides))
}
