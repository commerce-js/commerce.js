// ---------------------------------------------------------------------------
// BullMQ queue producer (hosted-checkout mirror)
// ---------------------------------------------------------------------------
//
// Producer-only. Enqueues `send-email` jobs onto the same `merchant-jobs`
// queue the dashboard's worker consumes. No worker here — only the dashboard
// runs the consumer (apps/dashboard/worker.ts). Keep this file in sync with
// apps/dashboard/server/utils/queue.ts for the shared SendEmailJob shape; any
// divergence produces silently malformed jobs at the worker.
// ---------------------------------------------------------------------------

import { Queue } from 'bullmq'
import type { JobsOptions } from 'bullmq'
import { createRedisConnection } from './redis'

export const MERCHANT_QUEUE = 'merchant-jobs'

export interface SendEmailJob {
  type: 'send-email'
  data: {
    merchantId: string
    to: string
    /** Template key — resolved against apps/dashboard/server/emails/ */
    template: string
    vars?: Record<string, unknown>
    subject?: string
  }
}

// Hosted-checkout currently only enqueues `send-email`. Expand the union
// if/when a second job type lands here.
export type MerchantJob = SendEmailJob

let _queue: Queue | null = null

export function getMerchantQueue(): Queue {
  if (_queue) return _queue

  _queue = new Queue(MERCHANT_QUEUE, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
      removeOnFail: { count: 5000, age: 7 * 24 * 60 * 60 },
    },
  })

  return _queue
}

export async function closeMerchantQueue(): Promise<void> {
  if (_queue) {
    await _queue.close()
    _queue = null
  }
}

export async function enqueueMerchantJob(
  job: MerchantJob,
  options?: JobsOptions,
): Promise<void> {
  const queue = getMerchantQueue()
  await queue.add(job.type, job.data, options)
}
