// ---------------------------------------------------------------------------
// Deploy Queue Consumer — processes deploy jobs from the queue
// ---------------------------------------------------------------------------
//
// This Nitro plugin registers a queue handler that Cloudflare Pages calls
// when messages arrive on the cjs-deploy-queue.
//
// Key patterns (from workers-best-practices + queues gotchas):
//   - Per-message try/catch — never let uncaught errors retry the batch
//   - Explicit msg.ack() / msg.retry() — never leave messages unhandled
//   - Idempotency — skip if deployment already processed
//   - Error classification — retry transient errors, ack permanent ones
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../database/schema'
import { provisionDeploy, isRetryable } from '../utils/deploy-provisioner'
import type { DeployJobMessage } from '../utils/deploy-queue'

export default defineNitroPlugin((nitro) => {
  // Cloudflare-specific: queue handler export for cjs-deploy-queue
  nitro._queue = async function queue(batch: any, env: any) {
    const db = drizzle(env.DB, { schema })

    for (const msg of batch.messages) {
      try {
        const job: DeployJobMessage = msg.body
        console.log(`[deploy-consumer] 🚀 Processing deploy: ${job.deployId} (attempt ${msg.attempts + 1})`)

        // Idempotency check — skip if already processed
        const [deployment] = await db
          .select()
          .from(schema.deployments)
          .where(eq(schema.deployments.id, job.deployId))

        if (!deployment) {
          console.warn(`[deploy-consumer] Deployment ${job.deployId} not found — acking`)
          msg.ack()
          continue
        }

        if (deployment.status === 'ready' || deployment.status === 'failed') {
          console.log(`[deploy-consumer] Deployment ${job.deployId} already ${deployment.status} — skipping`)
          msg.ack()
          continue
        }

        // Run provisioning via shared utility
        await provisionDeploy(db, job, {
          NUXT_CLOUDFLARE_API_TOKEN: env.NUXT_CLOUDFLARE_API_TOKEN,
          NUXT_CLOUDFLARE_ACCOUNT_ID: env.NUXT_CLOUDFLARE_ACCOUNT_ID,
          NUXT_NEON_API_KEY: env.NUXT_NEON_API_KEY,
        })

        msg.ack()
        console.log(`[deploy-consumer] ✅ Deploy ${job.deployId} completed`)
      }
      catch (error: any) {
        const message = error?.data?.errors?.[0]?.message || error?.message || String(error)
        console.error(`[deploy-consumer] ❌ Deploy failed:`, message)

        if (isRetryable(error)) {
          msg.retry({ delaySeconds: 60 })
        }
        else {
          // Permanent error — mark as failed and ack to prevent infinite retries
          try {
            const job: DeployJobMessage = msg.body
            await db
              .update(schema.deployments)
              .set({ status: 'failed', error: `Permanent error: ${message}` })
              .where(eq(schema.deployments.id, job.deployId))
          }
          catch {
            // Best-effort DB update
          }
          msg.ack()
        }
      }
    }
  }
})
