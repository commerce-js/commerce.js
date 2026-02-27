// ---------------------------------------------------------------------------
// POST /api/projects/:id/deploy — queue a deploy job
// ---------------------------------------------------------------------------
// 1. Validates the project exists and has a linked repo
// 2. Records a deployment record with status "building"
// 3. Sends a deploy job to the Cloudflare Queue
// 4. Returns 202 Accepted immediately
//
// The actual provisioning (CF Pages, Neon DB, env vars) happens in the
// queue consumer at server/plugins/deploy-consumer.ts.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../../utils/db'
import { sendDeployJob, type DeployJobMessage } from '../../../utils/deploy-queue'
import { provisionDeploy } from '../../../utils/deploy-provisioner'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const projectId = getRouterParam(event, 'id')!

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId))
  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  if (!project.repoUrl) {
    throw createError({ statusCode: 400, message: 'Project has no linked GitHub repo. Connect a repo first.' })
  }

  const body = await readBody<{
    environment?: 'production' | 'staging' | 'preview'
  }>(event)

  const environment = body.environment ?? 'production'
  const cfProjectName = `cjs-${project.name}`

  // Record deployment as "building"
  const deployId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await db.insert(schema.deployments).values({
    id: deployId,
    projectId,
    environment,
    status: 'building',
  })

  // Build the queue message
  const message: DeployJobMessage = {
    deployId,
    projectId,
    projectName: project.name,
    cfProjectName,
    repoUrl: project.repoUrl,
    environment,
    trigger: 'manual',
  }

  // Send to queue (falls back to inline provisioning for local dev)
  await sendDeployJob(message, async (msg) => {
    const config = useRuntimeConfig()
    await provisionDeploy(db, msg, {
      NUXT_CLOUDFLARE_API_TOKEN: config.cloudflareApiToken as string,
      NUXT_CLOUDFLARE_ACCOUNT_ID: config.cloudflareAccountId as string,
      NUXT_NEON_API_KEY: config.neonApiKey as string,
    })
  })

  setResponseStatus(event, 202)
  return {
    deploymentId: deployId,
    status: 'building',
    message: `Provisioning ${project.name}...`,
  }
})
