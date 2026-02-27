// ---------------------------------------------------------------------------
// Deploy Provisioner — shared provisioning logic for deploy jobs
// ---------------------------------------------------------------------------
//
// Used by:
//   - server/plugins/deploy-consumer.ts (queue consumer on Cloudflare)
//   - server/api/projects/[id]/deploy.post.ts (inline fallback for local dev)
//
// Extracts the full infra provisioning pipeline:
//   1. Create/verify CF Pages project + connect GitHub
//   2. Create Neon DB project
//   3. Set env vars on CF Pages
//   4. Update deployment status in D1
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { ofetch } from 'ofetch'
import * as schema from '../database/schema'
import type { DeployJobMessage } from './deploy-queue'

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

export interface ProvisionEnv {
  NUXT_CLOUDFLARE_API_TOKEN: string
  NUXT_CLOUDFLARE_ACCOUNT_ID: string
  NUXT_NEON_API_KEY?: string
}

/**
 * Provision infrastructure for a deploy job.
 *
 * @param db - Drizzle D1 instance
 * @param job - Deploy job message from the queue
 * @param env - Config values (API tokens, account IDs)
 */
export async function provisionDeploy(
  db: any,
  job: DeployJobMessage,
  env: ProvisionEnv,
): Promise<void> {
  const startTime = Date.now()
  const [repoOwner, repoName] = job.repoUrl.split('/')

  const cfToken = env.NUXT_CLOUDFLARE_API_TOKEN
  const cfAccountId = env.NUXT_CLOUDFLARE_ACCOUNT_ID
  const neonApiKey = env.NUXT_NEON_API_KEY

  if (!cfToken || !cfAccountId) {
    throw new PermanentError('Missing Cloudflare API credentials')
  }

  const cfHeaders = {
    'Authorization': `Bearer ${cfToken}`,
    'Content-Type': 'application/json',
  }

  // Update status to deploying
  await db
    .update(schema.deployments)
    .set({ status: 'deploying' })
    .where(eq(schema.deployments.id, job.deployId))

  const results: string[] = []

  // -------------------------------------------------------------------------
  // Step 1: Verify CF Pages project exists or create with GitHub source
  // -------------------------------------------------------------------------
  let pagesExists = false

  try {
    await ofetch(
      `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`,
      { headers: cfHeaders },
    )
    pagesExists = true
    results.push(`Pages exists: ${job.cfProjectName}`)
  }
  catch {
    pagesExists = false
  }

  if (!pagesExists) {
    await ofetch<{ result: any }>(
      `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects`,
      {
        method: 'POST',
        headers: cfHeaders,
        body: {
          name: job.cfProjectName,
          production_branch: 'main',
          build_config: {
            build_command: 'pnpm run build',
            destination_dir: '.output/public',
            root_dir: '/',
          },
          deployment_configs: {
            production: {
              compatibility_flags: ['nodejs_compat'],
              compatibility_date: '2026-02-01',
            },
          },
        },
      },
    )
    results.push(`Pages created: ${job.cfProjectName}`)

    // Connect GitHub repo (best-effort)
    try {
      await ofetch(
        `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`,
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
          },
        },
      )
      results.push(`GitHub connected: ${repoOwner}/${repoName}`)
    }
    catch (gitError: any) {
      const gitMsg = gitError?.data?.errors?.[0]?.message || gitError?.message || 'unknown'
      results.push(`GitHub auto-connect failed: ${gitMsg}`)
    }

    // Save CF project name to DB
    await db
      .update(schema.projects)
      .set({ cfPagesProjectName: job.cfProjectName, updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, job.projectId))
  }

  // -------------------------------------------------------------------------
  // Step 2: Create Neon DB project (skip if exists)
  // -------------------------------------------------------------------------
  let dbConnectionUri = ''

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, job.projectId))

  if (!project?.neonProjectId && neonApiKey) {
    try {
      const neonResult = await ofetch<{ project: any, connection_uris: any[] }>(
        `${NEON_API_BASE}/projects`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${neonApiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            project: {
              name: `cjs-${job.projectName}`,
              region_id: 'aws-eu-central-1',
              pg_version: 16,
            },
          },
        },
      )
      dbConnectionUri = neonResult.connection_uris?.[0]?.connection_uri ?? ''
      results.push(`Neon DB created: ${neonResult.project.id}`)

      await db
        .update(schema.projects)
        .set({ neonProjectId: neonResult.project.id, updatedAt: new Date().toISOString() })
        .where(eq(schema.projects.id, job.projectId))
    }
    catch (error: any) {
      results.push(`Neon DB error: ${error?.message || 'unknown'}`)
      if (isRetryable(error)) throw error
    }
  }
  else {
    results.push(`Neon DB exists: ${project?.neonProjectId || 'not configured'}`)
  }

  // -------------------------------------------------------------------------
  // Step 3: Set env vars on Pages project (DATABASE_URL)
  // -------------------------------------------------------------------------
  if (dbConnectionUri) {
    try {
      await ofetch(
        `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`,
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
      results.push('Env vars set')
    }
    catch (error: any) {
      results.push(`Env vars failed: ${error?.message || 'unknown'}`)
    }
  }

  // -------------------------------------------------------------------------
  // Done — mark deployment as ready
  // -------------------------------------------------------------------------
  const deployUrl = `https://${job.cfProjectName}.pages.dev`
  await db
    .update(schema.deployments)
    .set({
      status: 'ready',
      url: deployUrl,
      buildDurationMs: Date.now() - startTime,
      deployedAt: new Date().toISOString(),
    })
    .where(eq(schema.deployments.id, job.deployId))

  console.info(`[deploy-provisioner] ✅ Provisioned: ${results.join(' | ')}`)
  console.info(`[deploy-provisioner]    URL: ${deployUrl}`)
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export class PermanentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermanentError'
  }
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof PermanentError) return false

  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status
    if (status === 423 || status === 429 || status >= 500) return true
    if (status === 400 || status === 401 || status === 403 || status === 404) return false
  }

  if (error && typeof error === 'object' && 'statusCode' in error) {
    const status = (error as any).statusCode
    if (status === 423 || status === 429 || status >= 500) return true
    if (status === 400 || status === 401 || status === 403 || status === 404) return false
  }

  // Default: retry unknown errors (network failures, timeouts)
  return true
}
