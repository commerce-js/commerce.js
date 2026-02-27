// ---------------------------------------------------------------------------
// POST /api/projects/:id/deploy — provision & connect infrastructure
// ---------------------------------------------------------------------------
// 1. Creates a Cloudflare Pages project (if not exists)
// 2. Connects it to the project's GitHub repo for auto-builds
// 3. Creates a Neon DB (if not exists)
// 4. Sets env vars on the Pages project (DATABASE_URL, etc.)
//
// After this, every git push triggers a Cloudflare build automatically.
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

  // Run provisioning in background
  provisionAndConnect({
    db, deployId, projectId, project, cfProjectName, environment, config,
  }).catch((error) => {
    console.error('Provision error:', error)
  })

  return {
    deploymentId: deployId,
    status: 'building',
    message: `Provisioning and connecting ${project.name}...`,
  }
})

// ---------------------------------------------------------------------------
// Background: provision infra + connect GitHub repo
// ---------------------------------------------------------------------------
async function provisionAndConnect(ctx: {
  db: ReturnType<typeof useDB>
  deployId: string
  projectId: string
  project: any
  cfProjectName: string
  environment: string
  config: any
}) {
  const { db, deployId, projectId, project, cfProjectName, config } = ctx
  const startTime = Date.now()
  const [repoOwner, repoName] = (project.repoUrl as string).split('/')

  const cfHeaders = {
    Authorization: `Bearer ${config.cloudflareApiToken}`,
    'Content-Type': 'application/json',
  }

  try {
    const results: string[] = []

    // -----------------------------------------------------------------------
    // Step 1: Create Cloudflare Pages project (skip if exists)
    // -----------------------------------------------------------------------
    if (!project.cfPagesProjectName) {
      try {
        await ofetch<{ result: any }>(
          `${CF_API_BASE}/accounts/${config.cloudflareAccountId}/pages/projects`,
          {
            method: 'POST',
            headers: cfHeaders,
            body: {
              name: cfProjectName,
              production_branch: 'main',
              build_config: {
                build_command: 'pnpm run build',
                destination_dir: '.output/public',
                root_dir: '/',
              },
              deployment_configs: {
                production: {
                  compatibility_flags: ['nodejs_compat'],
                  compatibility_date: '2024-09-23',
                },
              },
            },
          },
        )
        results.push(`Pages project created: ${cfProjectName}`)
      }
      catch (error: any) {
        if (error?.status === 409 || error?.statusCode === 409) {
          results.push(`Pages project already exists`)
        }
        else {
          throw new Error(`Cloudflare Pages creation failed: ${error?.data?.errors?.[0]?.message || error?.message || 'unknown error'}`)
        }
      }

      // Save CF project name to DB
      await db.update(schema.projects)
        .set({ cfPagesProjectName: cfProjectName, updatedAt: new Date().toISOString() })
        .where(eq(schema.projects.id, projectId))
    }
    else {
      results.push(`Pages project exists: ${project.cfPagesProjectName}`)
    }

    // -----------------------------------------------------------------------
    // Step 2: Connect Pages project to GitHub repo
    // -----------------------------------------------------------------------
    try {
      // First, get GitHub installations connected to Cloudflare
      const installationsRes = await ofetch<{ result: any[] }>(
        `${CF_API_BASE}/accounts/${config.cloudflareAccountId}/pages/connections`,
        { headers: cfHeaders },
      )

      const githubInstallation = installationsRes?.result?.find(
        (inst: any) => inst.provider_type === 'github',
      )

      if (githubInstallation) {
        // PATCH the project to connect it to the GitHub repo
        await ofetch(
          `${CF_API_BASE}/accounts/${config.cloudflareAccountId}/pages/projects/${cfProjectName}`,
          {
            method: 'PATCH',
            headers: cfHeaders,
            body: {
              source: {
                type: 'github',
                config: {
                  owner: repoOwner,
                  repo_name: repoName,
                  production_branch: 'main',
                  deployments_enabled: true,
                  production_deployments_enabled: true,
                  preview_deployment_setting: 'all',
                  preview_branch_includes: ['*'],
                },
              },
              build_config: {
                build_command: 'pnpm run build',
                destination_dir: '.output/public',
                root_dir: '/',
              },
            },
          },
        )
        results.push(`Connected to GitHub: ${project.repoUrl}`)
      }
      else {
        results.push(`⚠️ No Cloudflare GitHub integration found — connect GitHub at https://dash.cloudflare.com`)
      }
    }
    catch (error: any) {
      // Don't fail the whole deploy if connection fails
      const msg = error?.data?.errors?.[0]?.message || error?.message || 'unknown'
      results.push(`GitHub connection failed: ${msg}`)
      console.warn('GitHub connection error:', msg)
    }

    // -----------------------------------------------------------------------
    // Step 3: Create Neon DB project (skip if exists)
    // -----------------------------------------------------------------------
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
        dbConnectionUri = neonResult.connection_uris?.[0]?.connection_uri ?? ''
        results.push(`Neon DB created: ${neonResult.project.id}`)

        await db.update(schema.projects)
          .set({ neonProjectId: neonResult.project.id, updatedAt: new Date().toISOString() })
          .where(eq(schema.projects.id, projectId))
      }
      catch (error: any) {
        results.push(`Neon DB skipped: ${error?.message || 'unknown error'}`)
      }
    }
    else {
      results.push(`Neon DB exists: ${project.neonProjectId || 'not configured'}`)
    }

    // -----------------------------------------------------------------------
    // Step 4: Set env vars on Pages project (DATABASE_URL)
    // -----------------------------------------------------------------------
    if (dbConnectionUri) {
      try {
        await ofetch(
          `${CF_API_BASE}/accounts/${config.cloudflareAccountId}/pages/projects/${cfProjectName}`,
          {
            method: 'PATCH',
            headers: cfHeaders,
            body: {
              deployment_configs: {
                production: {
                  env_vars: {
                    NUXT_COMMERCE_DATABASE_URL: { value: dbConnectionUri, type: 'secret_text' },
                  },
                },
              },
            },
          },
        )
        results.push('Environment variables set')
      }
      catch (error: any) {
        results.push(`Env vars failed: ${error?.message || 'unknown'}`)
      }
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

    console.info(`✅ Provisioned: ${results.join(' | ')}`)
    console.info(`   URL: https://${cfProjectName}.pages.dev`)
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
