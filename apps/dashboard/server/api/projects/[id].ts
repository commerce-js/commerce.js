// ---------------------------------------------------------------------------
// GET /api/projects/:id — get a project by ID
// PATCH /api/projects/:id — update a project
// DELETE /api/projects/:id — delete a project
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  if (event.method === 'GET') {
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id))
    if (!project) {
      throw createError({ statusCode: 404, message: 'Project not found' })
    }
    return project
  }

  if (event.method === 'PATCH') {
    const body = await readBody<Partial<{
      name: string
      repoUrl: string
      customDomain: string
      plan: 'starter' | 'pro' | 'enterprise'
      cfPagesProjectName: string
      r2BucketName: string
      kvNamespaceId: string
      neonProjectId: string
      neonBranchId: string
      dbConnectionString: string
      githubWebhookSecret: string
    }>>(event)

    const [updated] = await db.update(schema.projects)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, id))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 404, message: 'Project not found' })
    }
    return updated
  }

  if (event.method === 'DELETE') {
    await db.delete(schema.projects).where(eq(schema.projects.id, id))
    return { deleted: true }
  }
})
