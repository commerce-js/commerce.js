// ---------------------------------------------------------------------------
// BullMQ Worker — consumes merchant-jobs
// ---------------------------------------------------------------------------
//
// Standalone Node entry. Deployed to Fly.io as a second process (see
// `fly.toml → [processes] worker = "node .output/worker.mjs"`). Built by
// `pnpm build:worker` (esbuild bundle → .output/worker.mjs).
//
// Runtime shape:
//
//   Worker('merchant-jobs', dispatch, { connection, concurrency: 5 })
//     ├── provision-store   → handleProvisionStore(data)
//     ├── send-email        → handleSendEmail(data)       (SMTP via @commercejs/notification-smtp)
//     └── dispatch-webhook  → handleDispatchWebhook(data)
//
// The handlers themselves live in `server/utils/worker-handlers.ts` so
// unit tests can import them without triggering the Worker bootstrap /
// Redis connect below.
// ---------------------------------------------------------------------------

import process from 'node:process'
import { Worker } from 'bullmq'
import type { Job } from 'bullmq'
import { createRedisConnection } from './server/utils/redis'
import { MERCHANT_QUEUE } from './server/utils/queue'
import type {
  DispatchWebhookJob,
  MerchantJobType,
  ProvisionStoreJob,
  SendEmailJob,
} from './server/utils/queue'
import {
  handleProvisionStore,
  handleSendEmail,
  handleDispatchWebhook,
} from './server/utils/worker-handlers'

// ---------------------------------------------------------------------------
// Dispatch — single switch driven by job.name (populated by Queue.add(type))
// ---------------------------------------------------------------------------

async function dispatch(job: Job): Promise<void> {
  const name = job.name as MerchantJobType
  switch (name) {
    case 'provision-store':
      return handleProvisionStore(job.data as ProvisionStoreJob['data'])
    case 'send-email':
      return handleSendEmail(job.data as SendEmailJob['data'])
    case 'dispatch-webhook':
      return handleDispatchWebhook(job.data as DispatchWebhookJob['data'])
    default: {
      // Exhaustiveness check — appending a new MerchantJob type to queue.ts
      // without adding a case here is a compile error.
      const _exhaustive: never = name
      throw new Error(`unknown merchant-job type: ${_exhaustive as string}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

// `--dry-run` validates configuration and exits 0 WITHOUT opening a Redis
// connection or starting the worker. Used by CI (no Redis/secrets available)
// and as a post-build/deploy smoke check. Reports presence only — never values.
if (process.argv.includes('--dry-run')) {
  const present = (v: string | undefined): string => (v && v.length > 0 ? 'set' : 'MISSING')
  const hasRedis = !!process.env.REDIS_URL
    || (!!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN)
  const hasSmtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER
    && !!process.env.SMTP_PASS && !!process.env.SMTP_FROM
  console.log('[worker] --dry-run — configuration presence (no connections opened):')
  console.log('  REDIS_URL / Upstash pair : %s', hasRedis ? 'set' : 'MISSING')
  console.log('  NEON_CONTROL_DB_URL      : %s', present(process.env.NEON_CONTROL_DB_URL))
  console.log('  NEON_API_KEY             : %s', present(process.env.NEON_API_KEY))
  console.log('  NUXT_SESSION_PASSWORD    : %s', present(process.env.NUXT_SESSION_PASSWORD))
  console.log('  SMTP_* (host/user/pass/from) : %s', hasSmtp ? 'set' : 'MISSING')
  console.log('  WORKER_CONCURRENCY       : %s', process.env.WORKER_CONCURRENCY ?? '5 (default)')
  console.log('[worker] --dry-run OK — config parsed, exiting 0')
  process.exit(0)
}

const connection = createRedisConnection()
const worker = new Worker(MERCHANT_QUEUE, dispatch, {
  connection,
  concurrency: Number.parseInt(process.env.WORKER_CONCURRENCY ?? '5', 10),
})

worker.on('ready', () => {
  console.log('[worker] ready — consuming %s at concurrency %d', MERCHANT_QUEUE, worker.opts.concurrency)
})

worker.on('active', (job) => {
  console.log('[worker] active job=%s type=%s', job.id, job.name)
})

worker.on('completed', (job) => {
  console.log('[worker] completed job=%s type=%s', job.id, job.name)
})

worker.on('failed', (job, err) => {
  console.error(
    '[worker] failed job=%s type=%s attempt=%d: %s',
    job?.id,
    job?.name,
    job?.attemptsMade,
    err?.message,
  )
})

worker.on('error', (err) => {
  console.error('[worker] error:', err)
})

// Graceful shutdown so Fly's SIGTERM-before-kill actually flushes in-flight jobs.
async function shutdown(signal: string): Promise<void> {
  console.log('[worker] %s received, closing…', signal)
  try {
    await worker.close()
    await connection.quit()
  }
  finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
