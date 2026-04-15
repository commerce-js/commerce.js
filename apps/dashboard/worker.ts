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
//     ├── provision-store   → handleProvisionStore(data)       (Step 6)
//     ├── send-email        → handleSendEmail(data)
//     └── dispatch-webhook  → handleDispatchWebhook(data)
//
// Jobs that need tenant-scoped DB access wrap their body in
// `runWithDb(getPrismaClient(merchant.databaseUrl), () => …)` so the
// platform's `getDb()` (AsyncLocalStorage) returns that merchant's
// client. `provision-store` is special — it runs BEFORE the merchant has
// a database_url; it uses the control DB (via `useDB()`) to mutate the
// Merchant row and can skip the runWithDb wrapper.
// ---------------------------------------------------------------------------

import process from 'node:process'
import { createHash, createHmac } from 'node:crypto'
import { Worker } from 'bullmq'
import type { Job } from 'bullmq'
import { getPrismaClient, runWithDb } from '@commercejs/platform'
import { createRedisConnection } from './server/utils/redis'
import { MERCHANT_QUEUE } from './server/utils/queue'
import type {
  DispatchWebhookJob,
  MerchantJobType,
  ProvisionStoreJob,
  SendEmailJob,
} from './server/utils/queue'
import { useDB } from './server/utils/db'

// ---------------------------------------------------------------------------
// Handlers — each one owns a single job type.
// ---------------------------------------------------------------------------

async function handleProvisionStore(data: ProvisionStoreJob['data']): Promise<void> {
  const db = useDB()

  const merchant = await db.merchant.findUnique({ where: { id: data.merchantId } })
  if (!merchant) {
    throw new Error(`provision-store: merchant ${data.merchantId} not found`)
  }
  if (merchant.status === 'active' && merchant.databaseUrl) {
    // Idempotency guard — already provisioned, nothing to do.
    return
  }

  // Step 6 implements the real provisioning pipeline:
  //   1. Create Neon project / branch for this merchant.
  //   2. Apply packages/platform migrations to the new branch.
  //   3. await db.merchant.update({ where: { id }, data: {
  //        databaseUrl, neonProjectId, neonBranchId, status: 'active',
  //      } })
  //
  // For Step 5 we only wire the queue + worker plumbing. Mark the job as
  // a no-op so the queue stays testable end-to-end.
  console.log('[worker] provision-store stub for merchant %s — Step 6 will fill this in', data.merchantId)
}

async function handleSendEmail(data: SendEmailJob['data']): Promise<void> {
  // SMTP credentials live in the monorepo-root .secrets file / Fly secrets.
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('send-email: SMTP_* env vars are missing')
  }

  // Deliberately leaving the transport off the hot path for Step 5 — the
  // notification-smtp provider gets wired in alongside the Step 7 UI work
  // so we don't drag a templating engine into the worker bundle yet.
  console.log(
    '[worker] send-email stub — merchant=%s to=%s subject=%o (template=%s)',
    data.merchantId,
    data.to,
    data.subject,
    data.template,
  )

  // Log the connection parameters so operators can sanity-check secrets
  // without leaking the password.
  console.log('  SMTP target: %s:%s as %s', SMTP_HOST, SMTP_PORT ?? '587', SMTP_USER)
}

async function handleDispatchWebhook(data: DispatchWebhookJob['data']): Promise<void> {
  // Dispatch runs per-merchant; bind the Prisma client in case the handler
  // wants to record delivery attempts in the merchant DB.
  const prisma = getPrismaClient(await resolveMerchantDatabaseUrl(data.merchantId))

  await runWithDb(prisma, async () => {
    const body = JSON.stringify(data.payload)
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-commerce-event': data.event,
      'x-commerce-delivery-id': createHash('sha256')
        .update(`${data.merchantId}:${data.event}:${Date.now()}`)
        .digest('hex')
        .slice(0, 32),
    }
    if (data.secret) {
      const sig = createHmac('sha256', data.secret).update(body).digest('hex')
      headers['x-commerce-signature'] = `sha256=${sig}`
    }

    const res = await fetch(data.url, { method: 'POST', headers, body })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `webhook ${data.event} → ${data.url} responded ${res.status} ${res.statusText}: ${text.slice(0, 200)}`,
      )
    }
  })
}

async function resolveMerchantDatabaseUrl(merchantId: string): Promise<string> {
  const merchant = await useDB().merchant.findUnique({
    where: { id: merchantId },
    select: { databaseUrl: true },
  })
  if (!merchant?.databaseUrl) {
    throw new Error(`merchant ${merchantId} has no database_url — still provisioning?`)
  }
  return merchant.databaseUrl
}

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
