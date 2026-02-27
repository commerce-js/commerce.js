// ---------------------------------------------------------------------------
// GET /api/projects/:id/deploy-stream — SSE endpoint for deploy status
// ---------------------------------------------------------------------------
// Streams real-time status updates for a deployment using Server-Sent Events.
//
// Query params:
//   - deploymentId (optional) — target a specific deploy; defaults to latest active
//
// Events:
//   - status: { id, status, url, error, buildDurationMs }
//   - done:   sent when status is 'ready' or 'failed', then connection closes
//
// Guards:
//   - Auto-closes after 5 minutes (timeout)
//   - Polls D1 every 2s server-side (lightweight single-row query)
// ---------------------------------------------------------------------------

import { defineEventHandler, getRouterParam, getQuery, createEventStream } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { useDB, schema } from '../../../utils/db'

const POLL_MS = 2000
const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const deploymentId = query.deploymentId as string | undefined

  const eventStream = createEventStream(event)

  let lastStatus = ''
  let closed = false
  const startTime = Date.now()

  async function poll() {
    if (closed) return

    // Timeout guard
    if (Date.now() - startTime > TIMEOUT_MS) {
      await eventStream.push({ event: 'done', data: JSON.stringify({ reason: 'timeout' }) })
      closed = true
      eventStream.close()
      return
    }

    try {
      let deployment

      if (deploymentId) {
        const [row] = await db
          .select()
          .from(schema.deployments)
          .where(eq(schema.deployments.id, deploymentId))
        deployment = row
      }
      else {
        const [row] = await db
          .select()
          .from(schema.deployments)
          .where(eq(schema.deployments.projectId, projectId))
          .orderBy(desc(schema.deployments.deployedAt))
          .limit(1)
        deployment = row
      }

      if (!deployment) {
        await eventStream.push({ event: 'done', data: JSON.stringify({ reason: 'not_found' }) })
        closed = true
        eventStream.close()
        return
      }

      // Only emit when status changes
      if (deployment.status !== lastStatus) {
        lastStatus = deployment.status
        await eventStream.push({
          event: 'status',
          data: JSON.stringify({
            id: deployment.id,
            status: deployment.status,
            url: deployment.url,
            error: deployment.error,
            buildDurationMs: deployment.buildDurationMs,
          }),
        })

        // Terminal states — send done and close
        if (deployment.status === 'ready' || deployment.status === 'failed') {
          await eventStream.push({
            event: 'done',
            data: JSON.stringify({ id: deployment.id, status: deployment.status }),
          })
          closed = true
          eventStream.close()
          return
        }
      }
    }
    catch (error) {
      console.error('[deploy-stream] Poll error:', error)
    }

    // Schedule next poll
    if (!closed) {
      setTimeout(poll, POLL_MS)
    }
  }

  // Clean up on client disconnect
  eventStream.onClosed(() => {
    closed = true
  })

  // Start polling immediately
  poll()

  return eventStream.send()
})
