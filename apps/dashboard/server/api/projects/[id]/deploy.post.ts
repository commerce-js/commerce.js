// ---------------------------------------------------------------------------
// POST /api/projects/:id/deploy — provision infrastructure for a project
// ---------------------------------------------------------------------------
// This endpoint provisions Cloudflare Pages + Neon DB for the project.
// Actual builds happen via push-to-deploy (GitHub webhook → Cloudflare Pages).
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../../utils/db'
import { ofetch } from 'ofetch'

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

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

  // Run provisioning in a non-blocking way
  provisionAndUpdate({
    db,
    deployId,
    projectId,
    project,
    cfProjectName,
    environment,
    config,
  }).catch((error) => {
    console.error('Provision error:', error)
  })

  return {
    deploymentId: deployId,
    status: 'building',
    message: `Provisioning infrastructure for ${project.name}...`,
  }
})

// ---------------------------------------------------------------------------
// Background provisioning logic
// ---------------------------------------------------------------------------
async function provisionAndUpdate(ctx: {
  db: ReturnType<typeof useDB>
  deployId: string
  projectId: string
  project: any
  cfProjectName: string
  environment: string
  config: any
}) {
  const { db, deployId, projectId, project, cfProjectName, environment, config } = ctx
  const startTime = Date.now()

  try {
    const results: string[] = []

    // Step 1: Create Cloudflare Pages project (skip if already exists)
    if (!project.cfPagesProjectName) {
      try {
        const cfResult = await ofetch<{ result: any }>(
          `${CF_API_BASE}/accounts/${config.cloudflareAccountId}/pages/projects`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.cloudflareApiToken}`,
              'Content-Type': 'application/json',
            },
            body: {
              name: cfProjectName,
              production_branch: 'main',
              deployment_configs: {
                production: {
                  compatibility_flags: ['nodejs_compat'],
                  compatibility_date: '2024-09-23',
                },
              },
            },
          },
        )
        results.push(`Pages project created: ${cfResult.result.name}.pages.dev`)
      }
      catch (error: any) {
        // 409 = already exists, that's fine
        if (error?.status === 409 || error?.statusCode === 409) {
          results.push(`Pages project already exists: ${cfProjectName}`)
        }
        else {
          throw new Error(`Cloudflare Pages: ${error?.message || 'unknown error'}`)
        }
      }
    }
    else {
      results.push(`Pages project exists: ${project.cfPagesProjectName}`)
    }

    // Step 2: Create Neon DB project (skip if already exists)
    let dbConnectionUri = ''
    if (!project.neonProjectId && config.neonApiKey) {
      try {
        const neonResult = await ofetch<{ project: any; connection_uris: any[] }>(
          `${NEON_API_BASE}/projects`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.neonApiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              project: {
                name: `cjs-${project.name}`,
                region_id: 'aws-eu-central-1',
                pg_version: 16,
              },
            },
          },
        )
        const neonProjectId = neonResult.project.id
        dbConnectionUri = neonResult.connection_uris?.[0]?.connection_uri ?? ''
        results.push(`Neon DB created: ${neonProjectId}`)

        // Save Neon project ID
        await db.update(schema.projects)
          .set({ neonProjectId, updatedAt: new Date().toISOString() })
          .where(eq(schema.projects.id, projectId))
      }
      catch (error: any) {
        results.push(`Neon DB skipped: ${error?.message || 'unknown error'}`)
      }
    }
    else {
      results.push(`Neon DB exists: ${project.neonProjectId || 'not configured'}`)
    }

    // Step 3: Save Cloudflare project name
    if (!project.cfPagesProjectName) {
      await db.update(schema.projects)
        .set({
          cfPagesProjectName: cfProjectName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.projects.id, projectId))
    }

    // Mark deployment as ready
    const deployUrl = `https://${cfProjectName}.pages.dev`
    await db.update(schema.deployments)
      .set({
        status: 'ready',
        url: deployUrl,
        buildDurationMs: Date.now() - startTime,
        deployedAt: new Date().toISOString(),
      })
      .where(eq(schema.deployments.id, deployId))

    console.info(`✅ Infrastructure provisioned: ${results.join(', ')}`)
    console.info(`   Push to the repo to trigger the first build.`)
  }
  catch (error: any) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ Provisioning failed: ${message}`)

    await db.update(schema.deployments)
      .set({
        status: 'failed',
        error: message,
        buildDurationMs: Date.now() - startTime,
      })
      .where(eq(schema.deployments.id, deployId))
  }
}
