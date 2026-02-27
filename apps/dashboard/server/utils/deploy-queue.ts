// ---------------------------------------------------------------------------
// Deploy Queue — shared types and helpers for async deploy jobs
// ---------------------------------------------------------------------------

/**
 * Message shape sent to the deploy queue.
 * Contains everything the consumer needs to provision infrastructure.
 */
export interface DeployJobMessage {
  deployId: string
  projectId: string
  projectName: string
  cfProjectName: string
  repoUrl: string
  environment: 'production' | 'staging' | 'preview'
  commitSha?: string
  branch?: string
  trigger: 'manual' | 'webhook'
}

/**
 * Send a deploy job to the queue. Falls back to inline execution
 * when the Queue binding is unavailable (local dev without wrangler).
 */
export async function sendDeployJob(
  message: DeployJobMessage,
  inlineFallback?: (msg: DeployJobMessage) => Promise<void>,
): Promise<void> {
  const event = useEvent()
  const queue = (event.context.cloudflare?.env as any)?.DEPLOY_QUEUE

  if (queue) {
    await queue.send(message, { contentType: 'json' })
    console.log(`[deploy-queue] 📤 Queued deploy job: ${message.deployId}`)
  }
  else if (inlineFallback) {
    console.log(`[deploy-queue] ⚠️ No queue binding — running inline fallback`)
    await inlineFallback(message)
  }
  else {
    console.warn(`[deploy-queue] ⚠️ No queue binding and no fallback — deploy job ${message.deployId} not processed`)
  }
}
