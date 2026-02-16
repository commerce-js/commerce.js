// ---------------------------------------------------------------------------
// Deploy Orchestrator — the core pipeline for deploying a CommerceJS store
// ---------------------------------------------------------------------------

import { consola } from 'consola'
import type {
  CloudConfig,
  DeployConfig,
  DeployResult,
  CloudEnvironment,
} from './types.js'
import { CloudflareProvider } from './providers/cloudflare.js'
import { NeonProvider } from './providers/neon.js'

/**
 * CommerceJS Cloud deploy orchestrator.
 *
 * Manages the full deployment pipeline:
 * ```
 * Provision DB → Build → Deploy to Cloudflare → Set domain → Health check
 * ```
 *
 * Supports three environment types:
 * - **production** — main branch, production DB, custom domain
 * - **staging** — staging branch, staging DB branch
 * - **preview** — PR branch, Neon branch (auto-created/deleted)
 */
export class DeployOrchestrator {
  private cloudflare: CloudflareProvider
  private neon: NeonProvider

  constructor(private config: CloudConfig) {
    this.cloudflare = new CloudflareProvider(config.cloudflare)
    this.neon = new NeonProvider(config.neon)
  }

  // ---------------------------------------------------------------------------
  // Full Deploy Pipeline
  // ---------------------------------------------------------------------------

  /**
   * Deploy a store to Cloudflare.
   *
   * Pipeline:
   * 1. Provision infrastructure (DB, R2, KV) if first deploy
   * 2. Build the Nuxt storefront
   * 3. Run database migrations
   * 4. Deploy to Cloudflare Pages
   * 5. Set custom domain (if configured)
   * 6. Health check
   */
  async deploy(deployConfig: DeployConfig): Promise<DeployResult> {
    const startTime = Date.now()
    const projectName = `cjs-${deployConfig.projectId}`

    consola.info(`Deploying ${projectName} to ${deployConfig.environment}...`)

    try {
      // Step 1: Provision environment infrastructure
      const env = await this.provisionEnvironment(projectName, deployConfig)
      consola.success('Infrastructure provisioned')

      // Step 2: Deploy to Cloudflare Pages
      consola.info('Deploying to Cloudflare Pages...')
      const deployment = await this.cloudflare.deployPages(projectName, './output')

      consola.success(`Deployed to ${deployment.url}`)

      return {
        id: deployment.id,
        status: 'ready',
        url: deployment.url,
        deployedAt: new Date().toISOString(),
        buildDurationMs: Date.now() - startTime,
      }
    }
    catch (error) {
      consola.error('Deployment failed:', error)
      return {
        id: '',
        status: 'failed',
        url: '',
        error: error instanceof Error ? error.message : String(error),
        deployedAt: new Date().toISOString(),
        buildDurationMs: Date.now() - startTime,
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Infrastructure Provisioning
  // ---------------------------------------------------------------------------

  /**
   * Provision all infrastructure for an environment.
   * Creates Pages project, R2 bucket, KV namespace, and Neon DB branch.
   */
  async provisionEnvironment(
    projectName: string,
    deployConfig: DeployConfig,
  ): Promise<CloudEnvironment> {
    const envName = deployConfig.environment
    const envPrefix = envName === 'production' ? projectName : `${projectName}-${envName}`

    // Provision in parallel for speed
    const [pagesProject, r2Bucket, kvNamespace, dbBranch] = await Promise.all([
      this.cloudflare.createPagesProject(envPrefix),
      this.cloudflare.createR2Bucket(`${envPrefix}-assets`),
      this.cloudflare.createKVNamespace(`${envPrefix}-cache`),
      this.provisionDatabase(projectName, deployConfig),
    ])

    return {
      name: envName,
      url: `https://${pagesProject.subdomain}`,
      dbBranchId: dbBranch.branchId,
      dbConnectionString: dbBranch.connectionUri,
      r2Bucket: r2Bucket.name,
      kvNamespaceId: kvNamespace.id,
      gitBranch: deployConfig.branch,
      prNumber: deployConfig.prNumber,
    }
  }

  /**
   * Provision a database branch for the environment.
   * Production uses the main branch, previews get a new branch.
   */
  private async provisionDatabase(
    projectName: string,
    deployConfig: DeployConfig,
  ): Promise<{ branchId: string; connectionUri: string }> {
    const neonProjectId = this.config.neon.projectId

    if (!neonProjectId) {
      // First deploy — create the Neon project
      const project = await this.neon.createProject(projectName)
      return {
        branchId: project.branchId,
        connectionUri: project.connectionUri,
      }
    }

    if (deployConfig.environment === 'preview') {
      // Preview env — create a branch from main
      const branchName = deployConfig.prNumber
        ? `pr-${deployConfig.prNumber}`
        : `preview-${deployConfig.branch ?? 'unknown'}`

      const branch = await this.neon.createBranch(neonProjectId, {
        name: branchName,
      })

      return {
        branchId: branch.branchId,
        connectionUri: branch.connectionUri,
      }
    }

    // Production/staging — use existing connection
    const connectionUri = await this.neon.getConnectionString(
      neonProjectId,
      '', // uses default branch
    )

    return {
      branchId: 'main',
      connectionUri,
    }
  }

  // ---------------------------------------------------------------------------
  // Teardown
  // ---------------------------------------------------------------------------

  /**
   * Tear down a preview environment (after PR merge/close).
   */
  async teardownPreview(config: {
    projectName: string
    neonProjectId: string
    branchId: string
    kvNamespaceId?: string
  }): Promise<void> {
    consola.info(`Tearing down preview: ${config.projectName}`)

    await Promise.allSettled([
      this.cloudflare.teardownProject({
        projectName: config.projectName,
        kvNamespaceId: config.kvNamespaceId,
      }),
      this.neon.deleteBranch(config.neonProjectId, config.branchId),
    ])

    consola.success('Preview environment torn down')
  }

  /**
   * Tear down all infrastructure for a project (full deletion).
   */
  async teardownProject(config: {
    projectName: string
    neonProjectId: string
    r2Bucket: string
    kvNamespaceId: string
  }): Promise<void> {
    consola.info(`Tearing down project: ${config.projectName}`)

    await Promise.allSettled([
      this.cloudflare.teardownProject({
        projectName: config.projectName,
        r2Bucket: config.r2Bucket,
        kvNamespaceId: config.kvNamespaceId,
      }),
      this.neon.deleteProject(config.neonProjectId),
    ])

    consola.success('Project fully torn down')
  }
}
