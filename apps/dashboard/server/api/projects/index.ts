// ---------------------------------------------------------------------------
// GET /api/projects — list all projects
// POST /api/projects — create a new project
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../utils/db'

/**
 * GET: List all projects (optionally filter by ownerId)
 * POST: Create a new project
 */
export default defineEventHandler(async (event) => {
  const db = useDB()

  if (event.method === 'GET') {
    const projects = await db.select().from(schema.projects).orderBy(schema.projects.createdAt)
    return projects
  }

  // POST: Create new project
  const body = await readBody<{
    name: string
    ownerId: string
    repoUrl?: string
    customDomain?: string
    plan?: 'starter' | 'pro' | 'enterprise'
  }>(event)

  if (!body.name || !body.ownerId) {
    throw createError({ statusCode: 400, message: 'name and ownerId are required' })
  }

  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const subdomain = `${body.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.commercejs.cloud`

  try {
    await db.insert(schema.projects).values({
      id,
      name: body.name,
      ownerId: body.ownerId,
      repoUrl: body.repoUrl,
      customDomain: body.customDomain,
      subdomain,
      plan: body.plan ?? 'starter',
    })

    // Fetch the created project back (more reliable than .returning() on D1)
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id))
    return project
  }
  catch (error: any) {
    console.error('[projects] Failed to create project:', error.message || error)
    throw createError({
      statusCode: 500,
      message: `Failed to create project: ${error.message || 'Unknown error'}`,
    })
  }
})
