// ---------------------------------------------------------------------------
// GET /api/projects/:id/env — list env vars for a project
// POST /api/projects/:id/env — add an env var
// DELETE /api/projects/:id/env — delete an env var (pass { id } in body)
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!

  if (event.method === 'GET') {
    const vars = await db.select({
      id: schema.envVars.id,
      key: schema.envVars.key,
      // Mask secret values
      value: schema.envVars.value,
      isSecret: schema.envVars.isSecret,
      environment: schema.envVars.environment,
    })
      .from(schema.envVars)
      .where(eq(schema.envVars.projectId, projectId))

    // Mask secret values in response
    return vars.map(v => ({
      ...v,
      value: v.isSecret ? '••••••••' : v.value,
    }))
  }

  if (event.method === 'POST') {
    const body = await readBody<{
      key: string
      value: string
      isSecret?: boolean
      environment?: 'production' | 'staging' | 'preview' | 'all'
    }>(event)

    if (!body.key || !body.value) {
      throw createError({ statusCode: 400, message: 'key and value are required' })
    }

    const id = `env_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const [envVar] = await db.insert(schema.envVars).values({
      id,
      projectId,
      key: body.key,
      value: body.value,
      isSecret: body.isSecret ?? false,
      environment: body.environment ?? 'all',
    }).returning()

    return envVar
  }

  if (event.method === 'DELETE') {
    const body = await readBody<{ id: string }>(event)
    if (!body.id) {
      throw createError({ statusCode: 400, message: 'id is required' })
    }

    await db.delete(schema.envVars).where(
      and(
        eq(schema.envVars.id, body.id),
        eq(schema.envVars.projectId, projectId),
      ),
    )

    return { deleted: true }
  }
})
