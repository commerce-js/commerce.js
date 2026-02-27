// ---------------------------------------------------------------------------
// POST /api/github-webhook — receives GitHub push/PR events
// ---------------------------------------------------------------------------
//
// When a repo connected to a Cloud project receives a push, this endpoint:
//   1. Verifies HMAC-SHA256 signature (Web Crypto — works on CF Workers)
//   2. Looks up project by repository full_name
//   3. Records the deployment in the DB
//
// CF Pages auto-builds when the connected GitHub repo receives a push.
// This handler only RECORDS the event — it doesn't trigger builds.
//
// NOTE: No imports from @commercejs/cloud — that barrel re-exports
// DeployOrchestrator which pulls in execa (can't bundle for CF Workers).
// ---------------------------------------------------------------------------

import { defineEventHandler, readRawBody, getHeader } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { ofetch } from 'ofetch'
import { useDB, schema } from '../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty request body' })
  }

  const eventType = getHeader(event, 'x-github-event')
  const signature = getHeader(event, 'x-hub-signature-256')
  const deliveryId = getHeader(event, 'x-github-delivery')

  if (!eventType) {
    throw createError({ statusCode: 400, message: 'Missing x-github-event header' })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  }
  catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  // Ping — sent when webhook is first created
  if (eventType === 'ping') {
    console.log(`[github-webhook] 🏓 Ping received (hook_id: ${payload.hook_id})`)
    return { status: 'pong' }
  }

  if (eventType !== 'push' && eventType !== 'pull_request') {
    return { status: 'ignored', event: eventType }
  }

  // Look up project by repo
  const repoFullName = payload.repository?.full_name
  if (!repoFullName) {
    throw createError({ statusCode: 400, message: 'Missing repository info' })
  }

  const allProjects = await db.select().from(schema.projects)
  const project = allProjects.find((p) => {
    if (!p.repoUrl) return false
    return p.repoUrl === repoFullName
      || p.repoUrl === `https://github.com/${repoFullName}`
      || p.repoUrl.endsWith(`/${repoFullName}`)
  })

  if (!project) {
    console.log(`[github-webhook] No project found for repo: ${repoFullName}`)
    return { status: 'ignored', reason: 'no_matching_project' }
  }

  // Verify HMAC-SHA256 signature (inlined — no @commercejs/cloud import)
  const webhookSecret = project.githubWebhookSecret || config.githubWebhookSecret
  if (!webhookSecret) {
    throw createError({ statusCode: 401, message: 'Webhook secret not configured' })
  }
  if (!signature) {
    throw createError({ statusCode: 401, message: 'Missing x-hub-signature-256 header' })
  }

  const isValid = await verifyGitHubSignature(rawBody, signature, webhookSecret as string)
  if (!isValid) {
    console.warn(`[github-webhook] Invalid signature for project: ${project.name}`)
    throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
  }

  console.log(`[github-webhook] ✅ Verified event=${eventType} project=${project.name} delivery=${deliveryId}`)

  // Handle push to default branch → record production deployment
  if (eventType === 'push') {
    const branch = payload.ref?.replace('refs/heads/', '')
    const defaultBranch = payload.repository.default_branch

    if (branch !== defaultBranch) {
      return { status: 'ignored', reason: 'not_default_branch' }
    }

    const commitSha = payload.after
    const sender = payload.sender?.login || 'unknown'
    console.log(`[github-webhook] 🚀 Push to ${defaultBranch} by ${sender}`)

    // Record deployment — CF Pages auto-builds from the connected repo
    const deployId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const cfProjectName = project.cfPagesProjectName || `cjs-${project.name}`

    await db.insert(schema.deployments).values({
      id: deployId,
      projectId: project.id,
      environment: 'production',
      status: 'building',
      branch: defaultBranch,
      commitSha,
    })

    return {
      status: 'accepted',
      deploymentId: deployId,
      project: project.name,
      branch: defaultBranch,
      commit: commitSha?.slice(0, 7),
      url: `https://${cfProjectName}.pages.dev`,
    }
  }

  // Pull requests — preview environments with Neon DB branching
  if (eventType === 'pull_request') {
    const prNumber = payload.pull_request?.number
    const prAction = payload.action // opened, synchronize, closed, reopened
    const prBranch = payload.pull_request?.head?.ref
    const commitSha = payload.pull_request?.head?.sha
    const cfProjectName = project.cfPagesProjectName || `cjs-${project.name}`

    console.log(`[github-webhook] PR #${prNumber} ${prAction} branch=${prBranch}`)

    // Only handle relevant PR actions
    if (!['opened', 'synchronize', 'reopened', 'closed'].includes(prAction)) {
      return { status: 'ignored', reason: `pr_action_${prAction}` }
    }

    // -----------------------------------------------------------------------
    // PR closed/merged — clean up Neon branch
    // -----------------------------------------------------------------------
    if (prAction === 'closed') {
      // Find the preview deployment with a Neon branch to clean up
      const [previewDeploy] = await db
        .select()
        .from(schema.deployments)
        .where(eq(schema.deployments.projectId, project.id))
        .orderBy(desc(schema.deployments.deployedAt))

      const deploysToClean = await db
        .select()
        .from(schema.deployments)
        .where(eq(schema.deployments.projectId, project.id))

      const previewWithBranch = deploysToClean.find(
        (d: any) => d.prNumber === prNumber && d.neonPreviewBranchId,
      )

      if (previewWithBranch?.neonPreviewBranchId && project.neonProjectId) {
        try {
          const neonApiKey = config.neonApiKey as string
          await ofetch(
            `https://console.neon.tech/api/v2/projects/${project.neonProjectId}/branches/${previewWithBranch.neonPreviewBranchId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${neonApiKey}` },
            },
          )
          console.log(`[github-webhook] 🗑️ Deleted Neon branch for PR #${prNumber}`)
        }
        catch (error) {
          console.warn(`[github-webhook] Failed to delete Neon branch:`, error)
        }
      }

      // Mark all preview deployments for this PR as failed/closed
      const allPrDeploys = deploysToClean.filter((d: any) => d.prNumber === prNumber)
      for (const d of allPrDeploys) {
        if (d.status !== 'ready' && d.status !== 'failed') {
          await db
            .update(schema.deployments)
            .set({ status: 'failed', error: 'PR closed' })
            .where(eq(schema.deployments.id, d.id))
        }
      }

      return {
        status: 'cleaned',
        pr: prNumber,
        neonBranchDeleted: !!previewWithBranch?.neonPreviewBranchId,
      }
    }

    // -----------------------------------------------------------------------
    // PR opened/synchronize/reopened — create preview environment
    // -----------------------------------------------------------------------
    let neonBranchId = ''
    let previewDbUrl = ''

    // Create Neon branch for isolated preview data
    if (project.neonProjectId && project.neonBranchId) {
      try {
        const neonApiKey = config.neonApiKey as string
        const branchName = `pr-${prNumber}`

        const neonResponse = await ofetch<{ branch: any; connection_uris: any[] }>(
          `https://console.neon.tech/api/v2/projects/${project.neonProjectId}/branches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${neonApiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              branch: {
                name: branchName,
                parent_id: project.neonBranchId,
              },
              endpoints: [{ type: 'read_write' }],
            },
          },
        )

        neonBranchId = neonResponse.branch.id
        previewDbUrl = neonResponse.connection_uris?.[0]?.connection_uri ?? ''
        console.log(`[github-webhook] 🌿 Created Neon branch "${branchName}" for PR #${prNumber}`)
      }
      catch (error) {
        console.warn(`[github-webhook] Failed to create Neon branch:`, error)
        // Continue without Neon branch — preview still works, just shares main DB
      }
    }

    // Set preview DATABASE_URL env var on CF Pages (if we got a branch)
    if (previewDbUrl && cfProjectName) {
      try {
        const cfToken = config.cloudflareApiToken as string
        const cfAccountId = config.cloudflareAccountId as string

        await ofetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects/${cfProjectName}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${cfToken}`,
              'Content-Type': 'application/json',
            },
            body: {
              deployment_configs: {
                preview: {
                  env_vars: {
                    DATABASE_URL: { value: previewDbUrl, type: 'secret_text' },
                  },
                },
              },
            },
          },
        )
        console.log(`[github-webhook] 🔗 Set preview DATABASE_URL for PR #${prNumber}`)
      }
      catch (error) {
        console.warn(`[github-webhook] Failed to set preview env var:`, error)
      }
    }

    // Record preview deployment
    const deployId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.insert(schema.deployments).values({
      id: deployId,
      projectId: project.id,
      environment: 'preview',
      status: 'building',
      branch: prBranch,
      commitSha,
      prNumber,
      neonPreviewBranchId: neonBranchId || null,
    })

    const previewUrl = `https://${prBranch}.${cfProjectName}.pages.dev`

    return {
      status: 'accepted',
      deploymentId: deployId,
      project: project.name,
      pr: prNumber,
      branch: prBranch,
      previewUrl,
      neonBranch: neonBranchId || null,
    }
  }

  return { status: 'ok' }
})

// ---------------------------------------------------------------------------
// HMAC-SHA256 signature verification (Web Crypto API — works on CF Workers)
// ---------------------------------------------------------------------------
async function verifyGitHubSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const computed = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`

  // Constant-time comparison
  if (computed.length !== signatureHeader.length) return false
  let mismatch = 0
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signatureHeader.charCodeAt(i)
  }
  return mismatch === 0
}
