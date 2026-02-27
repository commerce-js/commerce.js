// ---------------------------------------------------------------------------
// Deploy DLQ Consumer — handles deploy jobs that exhausted all retries
// ---------------------------------------------------------------------------
//
// Messages land here after failing max_retries (3) attempts on the main queue.
// This handler marks the deployment as failed and logs for debugging.
// ---------------------------------------------------------------------------

import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../database/schema'
import type { DeployJobMessage } from '../utils/deploy-queue'

export default defineNitroPlugin((nitro) => {
  // Cloudflare-specific: DLQ consumer handler for cjs-deploy-dlq
  nitro._dlqQueue = async function queue(batch: any, env: any) {
    const db = drizzle(env.DB, { schema })

    for (const msg of batch.messages) {
      try {
        const job: DeployJobMessage = msg.body
        console.error(
          `[deploy-dlq] 💀 Deploy ${job.deployId} exhausted all retries`,
          `(project: ${job.projectName}, trigger: ${job.trigger})`,
        )

        // Mark deployment as permanently failed
        await db
          .update(schema.deployments)
          .set({
            status: 'failed',
            error: `Deploy failed after maximum retries. Project: ${job.projectName}, Environment: ${job.environment}`,
          })
          .where(eq(schema.deployments.id, job.deployId))

        msg.ack()
      }
      catch (error) {
        console.error('[deploy-dlq] Error processing DLQ message:', error)
        // Always ack DLQ messages — there's nowhere else for them to go
        msg.ack()
      }
    }
  }
})
