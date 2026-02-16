// ---------------------------------------------------------------------------
// Preview Environment Manager — branch-per-PR Neon databases
// ---------------------------------------------------------------------------

import { consola } from 'consola'
import { NeonProvider } from './providers/neon.js'
import { CloudflareProvider } from './providers/cloudflare.js'
import type { CloudConfig, CloudEnvironment } from './types.js'

/**
 * Preview Environment Manager
 *
 * Manages ephemeral preview environments tied to GitHub PRs:
 * - Creates a Neon DB branch per PR
 * - Deploys a Cloudflare Pages preview
 * - Tears down both on PR close/merge
 */
export class PreviewManager {
  private neon: NeonProvider
  private cloudflare: CloudflareProvider

  constructor(private config: CloudConfig) {
    this.neon = new NeonProvider(config.neon)
    this.cloudflare = new CloudflareProvider(config.cloudflare)
  }

  /**
   * Create a full preview environment for a PR.
   */
  async createPreview(opts: {
    projectName: string
    prNumber: number
    branch: string
    commitSha?: string
  }): Promise<CloudEnvironment> {
    const envName = `pr-${opts.prNumber}`
    const envPrefix = `${opts.projectName}-${envName}`

    consola.info(`Creating preview environment: ${envPrefix}`)

    const neonProjectId = this.config.neon.projectId
    if (!neonProjectId) {
      throw new Error('Neon project ID required for preview environments')
    }

    // Create DB branch + Cloudflare resources in parallel
    const [dbBranch, pagesProject, kvNamespace] = await Promise.all([
      this.neon.createBranch(neonProjectId, {
        name: envName,
      }),
      this.cloudflare.createPagesProject(envPrefix),
      this.cloudflare.createKVNamespace(`${envPrefix}-cache`),
    ])

    const env: CloudEnvironment = {
      name: envName,
      url: `https://${pagesProject.subdomain}`,
      dbBranchId: dbBranch.branchId,
      dbConnectionString: dbBranch.connectionUri,
      r2Bucket: '', // Previews share the main R2 bucket
      kvNamespaceId: kvNamespace.id,
      gitBranch: opts.branch,
      prNumber: opts.prNumber,
    }

    consola.success(`Preview ready: ${env.url}`)
    return env
  }

  /**
   * Tear down a preview environment (on PR close/merge).
   */
  async destroyPreview(opts: {
    projectName: string
    prNumber: number
  }): Promise<void> {
    const envName = `pr-${opts.prNumber}`
    const envPrefix = `${opts.projectName}-${envName}`

    const neonProjectId = this.config.neon.projectId
    if (!neonProjectId) return

    consola.info(`Tearing down preview: ${envPrefix}`)

    await Promise.allSettled([
      this.neon.deleteBranch(neonProjectId, envName),
      this.cloudflare.teardownProject({
        projectName: envPrefix,
      }),
    ])

    consola.success(`Preview ${envPrefix} torn down`)
  }

  /**
   * List all active preview environments for a project.
   */
  async listPreviews(projectName: string): Promise<string[]> {
    const neonProjectId = this.config.neon.projectId
    if (!neonProjectId) return []

    const branches = await this.neon.listBranches(neonProjectId)
    return branches
      .filter((b: { name: string }) => b.name.startsWith('pr-'))
      .map((b: { name: string }) => b.name)
  }
}
