// ---------------------------------------------------------------------------
// POST /api/github-webhook — receives GitHub push/PR events for auto-deploy
// ---------------------------------------------------------------------------
//
// GitHub sends events to this endpoint when a repo connected to a Cloud
// project receives a push or PR event. The endpoint:
//   1. Verifies HMAC-SHA256 signature
//   2. Looks up project by repository full_name → projects.repoUrl
//   3. Creates a deployment record and fires the orchestrator async
//
// Setup: In GitHub repo settings → Webhooks → Add webhook:
//   URL:    https://<dashboard>/api/github-webhook
//   Secret: (per-project secret from project settings)
//   Events: push, pull_request
// ---------------------------------------------------------------------------

import { defineEventHandler, readRawBody, getHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { WebhookHandler } from '@commercejs/cloud'
import { DeployOrchestrator } from '@commercejs/cloud'
import { useDB, schema } from '../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()

  // Read raw body for signature verification (must be raw, not parsed)
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty request body' })
  }

  // Parse headers
  const eventType = getHeader(event, 'x-github-event')
  const signature = getHeader(event, 'x-hub-signature-256')
  const deliveryId = getHeader(event, 'x-github-delivery')

  if (!eventType) {
    throw createError({ statusCode: 400, message: 'Missing x-github-event header' })
  }

  // Parse payload
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  }
  catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON payload' })
  }

  // Handle ping event (sent when webhook is first created)
  if (eventType === 'ping') {
    console.log(`[github-webhook] 🏓 Ping received (hook_id: ${payload.hook_id})`)
    return { status: 'pong' }
  }

  // Only handle push and pull_request events
  if (eventType !== 'push' && eventType !== 'pull_request') {
    return { status: 'ignored', event: eventType }
  }

  // Extract repo info from payload
  const repoFullName = payload.repository?.full_name
  if (!repoFullName) {
    throw createError({ statusCode: 400, message: 'Missing repository info in payload' })
  }

  // Look up project by repo URL
  // Match against both full URL and short form (e.g. "owner/repo")
  const allProjects = await db.select().from(schema.projects)
  const project = allProjects.find((p) => {
    if (!p.repoUrl) return false
    // Match "https://github.com/owner/repo", "github.com/owner/repo", or "owner/repo"
    return p.repoUrl === repoFullName
      || p.repoUrl === `https://github.com/${repoFullName}`
      || p.repoUrl.endsWith(`/${repoFullName}`)
  })

  if (!project) {
    console.log(`[github-webhook] No project found for repo: ${repoFullName}`)
    return { status: 'ignored', reason: 'no_matching_project' }
  }

  // Verify signature using per-project secret
  const webhookSecret = project.githubWebhookSecret || config.githubWebhookSecret
  if (!webhookSecret) {
    console.warn(`[github-webhook] No webhook secret configured for project: ${project.name}`)
    throw createError({ statusCode: 401, message: 'Webhook secret not configured' })
  }

  if (!signature) {
    throw createError({ statusCode: 401, message: 'Missing x-hub-signature-256 header' })
  }

  const isValid = await WebhookHandler.verifySignature(rawBody, signature, webhookSecret)
  if (!isValid) {
    console.warn(`[github-webhook] Invalid signature for project: ${project.name}`)
    throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
  }

  console.log(`[github-webhook] ✅ Verified event=${eventType} project=${project.name} delivery=${deliveryId}`)

  // Handle push to default branch → production deploy
  if (eventType === 'push') {
    const branch = payload.ref?.replace('refs/heads/', '')
    const defaultBranch = payload.repository.default_branch

    if (branch !== defaultBranch) {
      console.log(`[github-webhook] Push to ${branch} (not default ${defaultBranch}) — skipping`)
      return { status: 'ignored', reason: 'not_default_branch' }
    }

    const commitSha = payload.after
    const commitMessage = payload.head_commit?.message || ''
    const sender = payload.sender?.login || 'unknown'

    console.log(`[github-webhook] 🚀 Push to ${defaultBranch} by ${sender} — deploying production`)

    // Record deployment
    const deployId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.insert(schema.deployments).values({
      id: deployId,
      projectId: project.id,
      environment: 'production',
      status: 'building',
      branch: defaultBranch,
      commitSha,
    })

    // Get project env vars
    const envVars = await db.select()
      .from(schema.envVars)
      .where(eq(schema.envVars.projectId, project.id))
    const envVarMap = Object.fromEntries(
      envVars
        .filter(v => v.environment === 'production' || v.environment === 'all')
        .map(v => [v.key, v.value]),
    )

    // Fire deploy async (same pattern as deploy.post.ts)
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

    orchestrator.deploy({
      projectId: project.name,
      projectDir: process.cwd(),
      environment: 'production',
      branch: defaultBranch,
      commitSha,
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

      if (result.status === 'ready' && !project.cfPagesProjectName) {
        await db.update(schema.projects)
          .set({
            cfPagesProjectName: `cjs-${project.name}`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.projects.id, project.id))
      }

      console.log(`[github-webhook] Deploy ${deployId} finished: ${result.status}`)
    }).catch(async (error) => {
      await db.update(schema.deployments)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        })
        .where(eq(schema.deployments.id, deployId))
      console.error(`[github-webhook] Deploy ${deployId} failed:`, error)
    })

    return {
      status: 'accepted',
      deploymentId: deployId,
      project: project.name,
      branch: defaultBranch,
      commit: commitSha?.slice(0, 7),
    }
  }

  // Handle pull_request events (preview deploys — future enhancement)
  if (eventType === 'pull_request') {
    const action = payload.action
    const prNumber = payload.pull_request?.number

    console.log(`[github-webhook] PR #${prNumber} ${action} — preview deploys not yet implemented`)
    return {
      status: 'ignored',
      reason: 'preview_deploys_not_implemented',
      pr: prNumber,
      action,
    }
  }

  return { status: 'ok' }
})
