// ---------------------------------------------------------------------------
// BullMQ Queue — merchant-level background jobs
// ---------------------------------------------------------------------------
//
// Single queue (`merchant-jobs`) for everything off the hot request path:
//
//   - provision-store   — create Neon branch + run migrations + flip
//                         merchant.status from 'provisioning' → 'active'.
//                         Implementation lands in Step 6.
//   - send-email        — SMTP via SMTP_* env vars (welcome, trial-ending,
//                         order confirmation, etc.).
//   - dispatch-webhook  — outbound HTTP POST to merchant-registered URLs
//                         (order.created, fulfillment.shipped, …).
//
// Adding a new job type? Append it to the discriminated union below so
// every enqueuer and consumer is type-checked end-to-end.
// ---------------------------------------------------------------------------

import { Queue } from 'bullmq'
import type { JobsOptions } from 'bullmq'
import { createRedisConnection } from './redis'

export const MERCHANT_QUEUE = 'merchant-jobs'

// ---------------------------------------------------------------------------
// Job shapes
// ---------------------------------------------------------------------------

export interface ProvisionStoreJob {
  type: 'provision-store'
  data: {
    merchantId: string
  }
}

export interface SendEmailJob {
  type: 'send-email'
  data: {
    merchantId: string
    to: string
    /** Template key — resolved against apps/dashboard/server/emails/ */
    template: string
    vars?: Record<string, unknown>
    /**
     * Optional subject override. When undefined, the worker uses the
     * template's own subject. Callers rarely need to override — prefer
     * letting the template own its subject so every send of a given
     * template has consistent wording.
     */
    subject?: string
  }
}

export interface DispatchWebhookJob {
  type: 'dispatch-webhook'
  data: {
    merchantId: string
    event: string
    url: string
    payload: Record<string, unknown>
    /** Optional HMAC secret — if present, sign payload with sha256. */
    secret?: string
  }
}

export type MerchantJob = ProvisionStoreJob | SendEmailJob | DispatchWebhookJob
export type MerchantJobType = MerchantJob['type']

// ---------------------------------------------------------------------------
// Queue singleton
// ---------------------------------------------------------------------------

let _queue: Queue | null = null

export function getMerchantQueue(): Queue {
  if (_queue) return _queue

  _queue = new Queue(MERCHANT_QUEUE, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 1000, age: 24 * 60 * 60 }, // last 1000 or 24 h
      removeOnFail: { count: 5000, age: 7 * 24 * 60 * 60 }, // last 5000 or 7 d
    },
  })

  return _queue
}

/** Gracefully shut down the queue (call on SIGTERM in tests / workers). */
export async function closeMerchantQueue(): Promise<void> {
  if (_queue) {
    await _queue.close()
    _queue = null
  }
}

// ---------------------------------------------------------------------------
// Typed enqueue helpers
// ---------------------------------------------------------------------------

/**
 * Enqueue a merchant job. Overloads give per-type type safety without
 * requiring the caller to write `{ type, data } as MerchantJob`.
 */
export function enqueueMerchantJob(
  job: ProvisionStoreJob,
  options?: JobsOptions,
): Promise<void>
export function enqueueMerchantJob(
  job: SendEmailJob,
  options?: JobsOptions,
): Promise<void>
export function enqueueMerchantJob(
  job: DispatchWebhookJob,
  options?: JobsOptions,
): Promise<void>
export async function enqueueMerchantJob(
  job: MerchantJob,
  options?: JobsOptions,
): Promise<void> {
  const queue = getMerchantQueue()
  await queue.add(job.type, job.data, options)
}
