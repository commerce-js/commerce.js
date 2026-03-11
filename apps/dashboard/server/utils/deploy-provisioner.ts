// ---------------------------------------------------------------------------
// Deploy Provisioner — shared provisioning logic for deploy jobs
// ---------------------------------------------------------------------------
//
// Used by:
//   - server/plugins/deploy-consumer.ts (queue consumer on Cloudflare)
//   - server/api/projects/[id]/deploy.post.ts (inline fallback for local dev)
//
// Provisioning pipeline:
//   1. Create/verify CF Pages project (no GitHub source — uses GH Actions)
//   2. Create Neon DB project
//   3. Set env vars on CF Pages
//   4. Set GitHub Actions secrets on the user's repo
//   5. Trigger GH Actions workflow dispatch for first build
//   6. Mark deployment as ready
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import sealedbox from 'tweetnacl-sealedbox-js'
import * as schema from '../database/schema'
import type { DeployJobMessage } from './deploy-queue'

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'
const NEON_API_BASE = 'https://console.neon.tech/api/v2'
const GH_API_BASE = 'https://api.github.com'

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
  // Step 1: Verify CF Pages project exists or create it
  // -------------------------------------------------------------------------
  let pagesExists = false

  try {
    const checkRes = await fetch(
      `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`,
      { headers: cfHeaders },
    )
    pagesExists = checkRes.ok
    if (pagesExists) results.push(`Pages exists: ${job.cfProjectName}`)
  }
  catch {
    pagesExists = false
  }

  if (!pagesExists) {
    const createRes = await fetch(
      `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects`,
      {
        method: 'POST',
        headers: cfHeaders,
        body: JSON.stringify({
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
        }),
      },
    )

    if (!createRes.ok) {
      const errBody = await createRes.text()
      throw new Error(`CF Pages create failed: ${createRes.status} ${errBody}`)
    }

    results.push(`Pages created: ${job.cfProjectName}`)

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
      const neonRes = await fetch(`${NEON_API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: {
            name: `cjs-${job.projectName}`,
            region_id: 'aws-eu-central-1',
            pg_version: 16,
          },
        }),
      })

      if (!neonRes.ok) {
        const errBody = await neonRes.text()
        throw new Error(`Neon create failed: ${neonRes.status} ${errBody}`)
      }

      const neonResult = await neonRes.json() as { project: any, connection_uris: any[] }
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
      const envRes = await fetch(
        `${CF_API_BASE}/accounts/${cfAccountId}/pages/projects/${job.cfProjectName}`,
        {
          method: 'PATCH',
          headers: cfHeaders,
          body: JSON.stringify({
            deployment_configs: {
              production: {
                env_vars: {
                  NUXT_COMMERCE_DATABASE_URL: { value: dbConnectionUri, type: 'secret_text' },
                },
              },
            },
          }),
        },
      )
      if (envRes.ok) {
        results.push('Env vars set')
      }
      else {
        results.push(`Env vars failed: ${envRes.status}`)
      }
    }
    catch (error: any) {
      results.push(`Env vars failed: ${error?.message || 'unknown'}`)
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Set GitHub Actions secrets on the user's repo
  // -------------------------------------------------------------------------
  if (job.githubToken && repoOwner && repoName) {
    try {
      await setGitHubActionsSecrets(job.githubToken, repoOwner, repoName, {
        CLOUDFLARE_API_TOKEN: cfToken,
        CLOUDFLARE_ACCOUNT_ID: cfAccountId,
        CF_PAGES_PROJECT_NAME: job.cfProjectName,
      })
      results.push('GH Actions secrets set')

      // Step 5: Trigger first workflow run
      await triggerWorkflowDispatch(job.githubToken, repoOwner, repoName)
      results.push('GH Actions workflow triggered')
    }
    catch (error: any) {
      results.push(`GH Actions setup: ${error?.message || 'unknown'}`)
    }
  }
  else {
    results.push('GH Actions: skipped (no GitHub token)')
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
// GitHub Actions secrets — uses GitHub API with NaCl public-key encryption
// ---------------------------------------------------------------------------

/**
 * Set multiple GitHub Actions secrets on a repo.
 * Uses the GitHub Actions secrets API with libsodium-sealed-box encryption.
 */
async function setGitHubActionsSecrets(
  githubToken: string,
  owner: string,
  repo: string,
  secrets: Record<string, string>,
): Promise<void> {
  const ghHeaders = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'CommerceJS-Cloud',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // Get the repo's public key for encrypting secrets
  const keyRes = await fetch(
    `${GH_API_BASE}/repos/${owner}/${repo}/actions/secrets/public-key`,
    { headers: ghHeaders },
  )

  if (!keyRes.ok) {
    throw new Error(`Failed to get repo public key: ${keyRes.status}`)
  }

  const { key, key_id } = await keyRes.json() as { key: string, key_id: string }

  // Encrypt and set each secret
  for (const [name, value] of Object.entries(secrets)) {
    const encryptedValue = await encryptSecret(key, value)

    const putRes = await fetch(
      `${GH_API_BASE}/repos/${owner}/${repo}/actions/secrets/${name}`,
      {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          encrypted_value: encryptedValue,
          key_id,
        }),
      },
    )

    if (!putRes.ok && putRes.status !== 204) {
      const errBody = await putRes.text()
      console.warn(`[deploy-provisioner] Failed to set secret ${name}: ${putRes.status} ${errBody}`)
    }
  }
}

/**
 * Encrypt a secret value using the repo's public key (NaCl sealed box).
 * Uses tweetnacl-sealedbox-js — pure JS, compatible with CF Workers.
 */
function encryptSecret(publicKeyBase64: string, secretValue: string): string {
  const publicKeyBytes = base64ToUint8Array(publicKeyBase64)
  const encoder = new TextEncoder()
  const messageBytes = encoder.encode(secretValue)

  const encrypted = sealedbox.seal(messageBytes, publicKeyBytes)
  return uint8ArrayToBase64(encrypted)
}

/**
 * Trigger the deploy workflow on the repo.
 * Uses the workflow dispatch API to kick off the first build.
 */
async function triggerWorkflowDispatch(
  githubToken: string,
  owner: string,
  repo: string,
): Promise<void> {
  const ghHeaders = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'CommerceJS-Cloud',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // Trigger via workflow dispatch — requires the workflow to have workflow_dispatch trigger
  // Fallback: create an empty commit to trigger push-based workflow
  const dispatchRes = await fetch(
    `${GH_API_BASE}/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
    {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({ ref: 'main' }),
    },
  )

  if (dispatchRes.ok || dispatchRes.status === 204) {
    return
  }

  // Fallback: trigger via a lightweight push (update README timestamp)
  console.warn(`[deploy-provisioner] Workflow dispatch failed (${dispatchRes.status}), triggering via commit push`)

  // Get current README content
  const readmeRes = await fetch(
    `${GH_API_BASE}/repos/${owner}/${repo}/contents/README.md`,
    { headers: ghHeaders },
  )

  if (readmeRes.ok) {
    const readme = await readmeRes.json() as { content: string, sha: string }
    const currentContent = atob(readme.content)
    const updatedContent = `${currentContent}\n<!-- deployed: ${new Date().toISOString()} -->\n`

    await fetch(
      `${GH_API_BASE}/repos/${owner}/${repo}/contents/README.md`,
      {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: 'chore: trigger initial deploy',
          content: btoa(updatedContent),
          sha: readme.sha,
        }),
      },
    )
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = ''
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i])
  }
  return btoa(binaryString)
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
