// ---------------------------------------------------------------------------
// POST /api/projects/:id/deploy — trigger a deployment from the dashboard
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { DeployOrchestrator } from '@commercejs/cloud'
import { useDB, schema } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!
  const config = useRuntimeConfig()

  // Get project from DB
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId))
  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const body = await readBody<{
    environment?: 'production' | 'staging' | 'preview'
    branch?: string
    projectDir?: string
  }>(event)

  const environment = body.environment ?? 'production'

  // Record deployment as "building"
  const deployId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await db.insert(schema.deployments).values({
    id: deployId,
    projectId,
    environment,
    status: 'building',
    branch: body.branch,
  })

  // Get project env vars
  const envVars = await db.select()
    .from(schema.envVars)
    .where(eq(schema.envVars.projectId, projectId))
  const envVarMap = Object.fromEntries(
    envVars
      .filter(v => v.environment === environment || v.environment === 'all')
      .map(v => [v.key, v.value]),
  )

  // Create orchestrator and deploy
  const orchestrator = new DeployOrchestrator({
    cloudflare: {
      apiToken: config.cloudflareApiToken,
      accountId: config.cloudflareAccountId,
    },
    neon: {
      apiKey: config.neonApiKey,
      projectId: config.neonProjectId || project.neonProjectId || undefined,
    },
  })

  // Start deploy (non-blocking — update status when complete)
  // In production, this would use a queue (Cloudflare Queue or Durable Object)
  // For now, we fire-and-forget and update the DB when done
  orchestrator.deploy({
    projectId: project.name,
    projectDir: body.projectDir ?? process.cwd(),
    environment,
    branch: body.branch,
    envVars: envVarMap,
  }).then(async (result) => {
    await db.update(schema.deployments)
      .set({
        status: result.status,
        url: result.url,
        error: result.error,
        buildDurationMs: result.buildDurationMs,
        deployedAt: result.deployedAt,
      })
      .where(eq(schema.deployments.id, deployId))

    // Update project with infra IDs if this is the first deploy
    if (result.status === 'ready' && !project.cfPagesProjectName) {
      await db.update(schema.projects)
        .set({
          cfPagesProjectName: `cjs-${project.name}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.projects.id, projectId))
    }
  }).catch(async (error) => {
    await db.update(schema.deployments)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(schema.deployments.id, deployId))
  })

  // Return immediately with the deployment record
  return {
    deploymentId: deployId,
    status: 'building',
    message: `Deployment started for ${project.name} to ${environment}`,
  }
})
