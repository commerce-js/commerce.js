// ---------------------------------------------------------------------------
// GitHub Webhook Handler — processes push/PR events for auto-deploy
// ---------------------------------------------------------------------------

import { consola } from 'consola'
import type { CloudConfig } from './types.js'
import { DeployOrchestrator } from './deploy.js'
import { GitHubProvider } from './providers/github.js'

/**
 * Webhook event types we handle.
 */
export interface WebhookEvent {
  action?: string
  ref?: string
  repository: {
    full_name: string
    default_branch: string
  }
  pull_request?: {
    number: number
    head: {
      ref: string
      sha: string
    }
    merged?: boolean
  }
  sender: {
    login: string
  }
}

/**
 * GitHub Webhook Handler
 *
 * Listens for push and pull_request events to trigger automatic deployments:
 *
 * - `push` to default branch → deploy to **production**
 * - `pull_request.opened/synchronize` → deploy **preview** environment
 * - `pull_request.closed` → teardown preview environment
 */
export class WebhookHandler {
  private orchestrator: DeployOrchestrator
  private github: GitHubProvider
  private projectDir: string

  constructor(private config: CloudConfig, options?: { projectDir?: string }) {
    this.orchestrator = new DeployOrchestrator(config)
    this.projectDir = options?.projectDir ?? process.cwd()

    if (!config.github) {
      throw new Error('GitHub config required for webhook handler')
    }
    this.github = new GitHubProvider(config.github)
  }

  /**
   * Process an incoming GitHub webhook event.
   *
   * @param eventType - The X-GitHub-Event header value
   * @param payload - Parsed JSON body
   */
  async handleEvent(eventType: string, payload: WebhookEvent): Promise<void> {
    switch (eventType) {
      case 'push':
        await this.handlePush(payload)
        break
      case 'pull_request':
        await this.handlePullRequest(payload)
        break
      default:
        consola.debug(`Ignoring event: ${eventType}`)
    }
  }

  /**
   * Handle push event — deploy production if targeting default branch.
   */
  private async handlePush(payload: WebhookEvent): Promise<void> {
    const branch = payload.ref?.replace('refs/heads/', '')
    const defaultBranch = payload.repository.default_branch

    if (branch !== defaultBranch) {
      consola.debug(`Push to ${branch} — not default branch, skipping`)
      return
    }

    consola.info(`Push to ${defaultBranch} by ${payload.sender.login} — deploying production`)

    const projectName = this.projectNameFromRepo(payload.repository.full_name)

    await this.orchestrator.deploy({
      projectId: projectName,
      projectDir: this.projectDir,
      environment: 'production',
      branch: defaultBranch,
    })
  }

  /**
   * Handle pull_request event — create/update/delete preview environments.
   */
  private async handlePullRequest(payload: WebhookEvent): Promise<void> {
    if (!payload.pull_request) return

    const pr = payload.pull_request
    const projectName = this.projectNameFromRepo(payload.repository.full_name)

    switch (payload.action) {
      case 'opened':
      case 'synchronize':
      case 'reopened': {
        consola.info(`PR #${pr.number} (${payload.action}) — deploying preview`)

        const result = await this.orchestrator.deploy({
          projectId: projectName,
          projectDir: this.projectDir,
          environment: 'preview',
          branch: pr.head.ref,
          prNumber: pr.number,
          commitSha: pr.head.sha,
        })

        if (result.url) {
          consola.success(`Preview: ${result.url}`)
          // TODO: Post comment on PR with preview URL
        }
        break
      }

      case 'closed': {
        consola.info(`PR #${pr.number} closed — tearing down preview`)

        await this.orchestrator.teardownPreview({
          projectName: `${projectName}-preview-pr-${pr.number}`,
          neonProjectId: this.config.neon.projectId ?? '',
          branchId: `pr-${pr.number}`,
        })
        break
      }

      default:
        consola.debug(`PR action ${payload.action} — no-op`)
    }
  }

  /**
   * Derive a project name from a GitHub repo full name.
   */
  private projectNameFromRepo(fullName: string): string {
    return `cjs-${fullName.replace('/', '-').toLowerCase()}`
  }

  /**
   * Verify GitHub webhook signature (HMAC SHA-256).
   *
   * Uses Web Crypto API for cross-runtime compatibility
   * (Node.js 18+, Cloudflare Workers, Deno).
   *
   * @param body - Raw request body as string
   * @param signature - The `x-hub-signature-256` header value (e.g. `sha256=abc123...`)
   * @param secret - The webhook secret configured in GitHub
   */
  static async verifySignature(
    body: string,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    if (!signature || !secret || !body) return false
    if (!signature.startsWith('sha256=')) return false

    const encoder = new TextEncoder()

    // Import secret as HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    // Compute expected signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body),
    )

    // Convert to hex
    const expectedHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const expected = `sha256=${expectedHex}`
    const received = signature

    // Timing-safe comparison via double-hashing
    // (avoids timing leaks from string comparison)
    if (expected.length !== received.length) return false

    const expectedHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(expected),
    )
    const receivedHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(received),
    )

    const a = new Uint8Array(expectedHash)
    const b = new Uint8Array(receivedHash)
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i]
    }
    return result === 0
  }
}
