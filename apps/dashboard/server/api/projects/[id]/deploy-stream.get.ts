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

import { defineEventHandler, getRouterParam, getQuery, setResponseHeaders } from 'h3'
import { eq, and, desc } from 'drizzle-orm'
import { useDB, schema } from '../../../../utils/db'

const POLL_MS = 2000
const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const deploymentId = query.deploymentId as string | undefined

  // SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  })

  const encoder = new TextEncoder()
  let lastStatus = ''
  let closed = false
  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      function send(eventName: string, data: unknown) {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      async function poll() {
        if (closed) return

        // Timeout guard
        if (Date.now() - startTime > TIMEOUT_MS) {
          send('done', { reason: 'timeout' })
          closed = true
          controller.close()
          return
        }

        try {
          let deployment

          if (deploymentId) {
            // Fetch specific deployment
            const [row] = await db
              .select()
              .from(schema.deployments)
              .where(eq(schema.deployments.id, deploymentId))
            deployment = row
          }
          else {
            // Find latest active deployment for this project
            const [row] = await db
              .select()
              .from(schema.deployments)
              .where(eq(schema.deployments.projectId, projectId))
              .orderBy(desc(schema.deployments.createdAt))
              .limit(1)
            deployment = row
          }

          if (!deployment) {
            send('done', { reason: 'not_found' })
            closed = true
            controller.close()
            return
          }

          // Only emit when status changes
          if (deployment.status !== lastStatus) {
            lastStatus = deployment.status
            send('status', {
              id: deployment.id,
              status: deployment.status,
              url: deployment.url,
              error: deployment.error,
              buildDurationMs: deployment.buildDurationMs,
            })

            // Terminal states — send done and close
            if (deployment.status === 'ready' || deployment.status === 'failed') {
              send('done', { id: deployment.id, status: deployment.status })
              closed = true
              controller.close()
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

      // Start polling immediately
      poll()
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
})
