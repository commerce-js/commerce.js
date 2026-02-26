// ---------------------------------------------------------------------------
// GET /api/projects/:id/deployments — list deployments for a project
// POST /api/projects/:id/deployments — record a new deployment
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { useDB, schema } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!

  if (event.method === 'GET') {
    const deploys = await db.select()
      .from(schema.deployments)
      .where(eq(schema.deployments.projectId, projectId))
      .orderBy(desc(schema.deployments.deployedAt))
      .limit(50)

    return deploys
  }

  // POST: Record a deployment
  const body = await readBody<{
    environment: 'production' | 'staging' | 'preview'
    status: 'building' | 'deploying' | 'ready' | 'failed'
    url?: string
    branch?: string
    commitSha?: string
    prNumber?: number
    error?: string
    buildDurationMs?: number
  }>(event)

  const id = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const [deployment] = await db.insert(schema.deployments).values({
    id,
    projectId,
    environment: body.environment,
    status: body.status,
    url: body.url,
    branch: body.branch,
    commitSha: body.commitSha,
    prNumber: body.prNumber,
    error: body.error,
    buildDurationMs: body.buildDurationMs,
  }).returning()

  return deployment
})
