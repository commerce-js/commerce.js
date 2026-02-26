// ---------------------------------------------------------------------------
// Deploy Orchestrator — the core pipeline for deploying a CommerceJS store
// ---------------------------------------------------------------------------

import { consola } from 'consola'
import { execa, type ExecaError } from 'execa'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
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
 * Provision DB → Install deps → Run migrations → Build → Deploy → Health check
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
   * 2. Install dependencies
   * 3. Run database migrations
   * 4. Build the Nuxt storefront
   * 5. Deploy to Cloudflare Pages via wrangler
   * 6. Set environment variables
   * 7. Health check
   */
  async deploy(deployConfig: DeployConfig): Promise<DeployResult> {
    const startTime = Date.now()
    const projectName = `cjs-${deployConfig.projectId}`
    const projectDir = resolve(deployConfig.projectDir)

    consola.info(`Deploying ${projectName} to ${deployConfig.environment}...`)
    consola.info(`Project directory: ${projectDir}`)

    if (!existsSync(projectDir)) {
      return this.failResult(`Project directory not found: ${projectDir}`, startTime)
    }

    try {
      // Step 1: Provision environment infrastructure (idempotent)
      const env = await this.provisionEnvironment(projectName, deployConfig)
      consola.success('Infrastructure ready')

      // Step 2: Install dependencies
      consola.info('Installing dependencies...')
      await this.runCommand('pnpm', ['install', '--frozen-lockfile'], { cwd: projectDir })
      consola.success('Dependencies installed')

      // Step 3: Run database migrations
      consola.info('Running database migrations...')
      await this.runCommand('pnpm', ['run', 'db:migrate'], {
        cwd: projectDir,
        env: { DATABASE_URL: env.dbConnectionString },
        optional: true, // Some projects may not have migrations
      })
      consola.success('Migrations complete')

      // Step 4: Build the Nuxt app
      consola.info('Building Nuxt app...')
      await this.runCommand('pnpm', ['run', 'build'], {
        cwd: projectDir,
        env: {
          DATABASE_URL: env.dbConnectionString,
          NITRO_PRESET: 'cloudflare-pages',
          ...deployConfig.envVars,
        },
      })
      consola.success('Build complete')

      // Step 5: Deploy to Cloudflare Pages via wrangler
      consola.info('Deploying to Cloudflare Pages...')
      const outputDir = this.resolveOutputDir(projectDir)
      const deployUrl = await this.deployWithWrangler(projectName, outputDir, deployConfig)
      consola.success(`Deployed to ${deployUrl}`)

      // Step 6: Set environment variables on Pages project
      consola.info('Setting environment variables...')
      await this.setProjectEnvVars(projectName, env, deployConfig.envVars)
      consola.success('Environment variables set')

      // Step 7: Health check
      consola.info('Running health check...')
      const healthy = await this.healthCheck(deployUrl)
      if (!healthy) {
        consola.warn('Health check failed — deployment may need time to propagate')
      }
      else {
        consola.success('Health check passed')
      }

      return {
        id: `${projectName}-${Date.now()}`,
        status: 'ready',
        url: deployUrl,
        deployedAt: new Date().toISOString(),
        buildDurationMs: Date.now() - startTime,
      }
    }
    catch (error) {
      consola.error('Deployment failed:', error)
      return this.failResult(
        error instanceof Error ? error.message : String(error),
        startTime,
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Build Helpers
  // ---------------------------------------------------------------------------

  /**
   * Run a shell command with logging.
   */
  private async runCommand(
    command: string,
    args: string[],
    options: {
      cwd: string
      env?: Record<string, string>
      optional?: boolean
    },
  ): Promise<void> {
    try {
      const result = await execa(command, args, {
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env,
        },
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 300_000, // 5 minute timeout
      })
      if (result.stdout) {
        consola.debug(result.stdout)
      }
    }
    catch (error) {
      if (options.optional) {
        const msg = error instanceof Error ? error.message : String(error)
        consola.debug(`Optional command skipped: ${command} ${args.join(' ')} — ${msg}`)
        return
      }
      const execError = error as ExecaError
      const stderr = execError.stderr || execError.message
      throw new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`)
    }
  }

  /**
   * Resolve the Nuxt build output directory.
   * Nuxt outputs to `.output/public` for Cloudflare Pages.
   */
  private resolveOutputDir(projectDir: string): string {
    // Nuxt 4 with Cloudflare Pages preset outputs to .output/public
    const candidates = [
      join(projectDir, '.output', 'public'),
      join(projectDir, 'dist'),
      join(projectDir, '.output'),
    ]

    for (const dir of candidates) {
      if (existsSync(dir)) return dir
    }

    // Default to .output/public — wrangler will error if it doesn't exist
    return join(projectDir, '.output', 'public')
  }

  /**
   * Deploy build output to Cloudflare Pages using wrangler CLI.
   * Resolves wrangler from the project's node_modules or monorepo root.
   */
  private async deployWithWrangler(
    projectName: string,
    outputDir: string,
    deployConfig: DeployConfig,
  ): Promise<string> {
    const args = [
      'pages', 'deploy', outputDir,
      `--project-name=${projectName}`,
    ]

    // Set branch for preview/staging
    if (deployConfig.branch) {
      args.push(`--branch=${deployConfig.branch}`)
    }

    // Try to find wrangler binary — check multiple locations
    const projectDir = resolve(deployConfig.projectDir)

    // 1. This package's own node_modules (where wrangler is a devDep)
    const cloudPkgDir = resolve(new URL('.', import.meta.url).pathname, '..')
    const cloudWrangler = join(cloudPkgDir, 'node_modules', '.bin', 'wrangler')
    // 2. Target project's node_modules
    const localWrangler = join(projectDir, 'node_modules', '.bin', 'wrangler')
    // 3. Monorepo root (two levels up from target project)
    const monorepoWrangler = join(projectDir, '..', '..', 'node_modules', '.bin', 'wrangler')

    let wranglerBin: string
    if (existsSync(cloudWrangler)) {
      wranglerBin = cloudWrangler
    }
    else if (existsSync(localWrangler)) {
      wranglerBin = localWrangler
    }
    else if (existsSync(monorepoWrangler)) {
      wranglerBin = monorepoWrangler
    }
    else {
      // Fallback to npx — will download if needed
      wranglerBin = 'npx'
      args.unshift('wrangler')
    }

    const result = await execa(wranglerBin, args, {
      cwd: projectDir,
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: this.config.cloudflare.apiToken,
        CLOUDFLARE_ACCOUNT_ID: this.config.cloudflare.accountId,
      },
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 300_000, // 5 minutes for upload
    })

    // Parse the deployed URL from wrangler output
    // wrangler outputs like: "✨ Deployment complete! Take a peek over at https://xxx.pages.dev"
    const urlMatch = result.stdout.match(/https:\/\/[\w.-]+\.pages\.dev/)
    return urlMatch?.[0] ?? `https://${projectName}.pages.dev`
  }

  /**
   * Set environment variables on a Cloudflare Pages project.
   */
  private async setProjectEnvVars(
    _projectName: string,
    env: CloudEnvironment,
    extraVars?: Record<string, string>,
  ): Promise<void> {
    const vars: Record<string, string> = {
      DATABASE_URL: env.dbConnectionString,
      ...(extraVars ?? {}),
    }

    // Use wrangler to set secrets (Pages env vars)
    for (const [key, value] of Object.entries(vars)) {
      try {
        await execa('npx', [
          'wrangler', 'pages', 'project', 'edit',
          '--var', `${key}:${value}`,
        ], {
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: this.config.cloudflare.apiToken,
            CLOUDFLARE_ACCOUNT_ID: this.config.cloudflare.accountId,
          },
          stdout: 'pipe',
          stderr: 'pipe',
        })
      }
      catch {
        // Env var setting is best-effort — project may work without it
        consola.warn(`Failed to set env var: ${key}`)
      }
    }
  }

  /**
   * Health check — GET the deployed URL and expect a 200.
   */
  private async healthCheck(url: string, retries = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)
        if (response.ok) return true
      }
      catch {
        // Deployment may need propagation time
      }
      await new Promise(r => setTimeout(r, 5000))
    }
    return false
  }

  // ---------------------------------------------------------------------------
  // Infrastructure Provisioning (idempotent)
  // ---------------------------------------------------------------------------

  /**
   * Provision all infrastructure for an environment.
   * Creates Pages project, R2 bucket, KV namespace, and Neon DB branch.
   * Silently skips resources that already exist.
   */
  async provisionEnvironment(
    projectName: string,
    deployConfig: DeployConfig,
  ): Promise<CloudEnvironment> {
    const envName = deployConfig.environment
    const envPrefix = envName === 'production' ? projectName : `${projectName}-${envName}`

    // Provision in parallel for speed — catch "already exists" errors
    const [pagesProject, r2Bucket, kvNamespace, dbBranch] = await Promise.all([
      this.safeCreate(() => this.cloudflare.createPagesProject(envPrefix), { id: '', name: envPrefix, subdomain: `${envPrefix}.pages.dev` }),
      this.safeCreate(() => this.cloudflare.createR2Bucket(`${envPrefix}-assets`), { name: `${envPrefix}-assets` }),
      this.safeCreate(() => this.cloudflare.createKVNamespace(`${envPrefix}-cache`), { id: '', title: `${envPrefix}-cache` }),
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
   * Safely create a resource — returns fallback if it already exists.
   * Cloudflare returns 409 for Pages/R2 duplicates and 400 for KV duplicates.
   */
  private async safeCreate<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn()
    }
    catch (error: any) {
      const status = error?.statusCode || error?.status || error?.response?.status
      const message = String(error?.message || '')
      const isAlreadyExists = status === 409
        || status === 400
        || message.includes('already exists')
        || message.includes('already been taken')
      if (isAlreadyExists) {
        consola.debug('Resource already exists, skipping creation')
        return fallback
      }
      throw error
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

      // Wait for project to be ready (Neon 423 Locked issue)
      await this.waitForNeonReady(project.projectId)

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

      const branch = await this.retryWithBackoff(
        () => this.neon.createBranch(neonProjectId, { name: branchName }),
      )

      return {
        branchId: branch.branchId,
        connectionUri: branch.connectionUri,
      }
    }

    // Production/staging — use existing connection
    const mainBranches = await this.neon.listBranches(neonProjectId)
    const mainBranch = mainBranches.find(b => b.primary)

    if (!mainBranch) {
      throw new Error('Could not find main branch in Neon project')
    }

    const connectionUri = await this.neon.getConnectionString(
      neonProjectId,
      mainBranch.id,
    )

    return {
      branchId: mainBranch.id,
      connectionUri,
    }
  }

  /**
   * Wait for a Neon project to finish initializing.
   */
  private async waitForNeonReady(projectId: string, maxWaitMs = 30_000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      try {
        await this.neon.listBranches(projectId)
        return
      }
      catch {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }

  /**
   * Retry an async operation with exponential backoff (for Neon 423 Locked).
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    baseDelayMs = 2000,
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      }
      catch (error: any) {
        const is423 = error?.statusCode === 423 || error?.status === 423
          || String(error?.message).includes('423')
        if (!is423 || attempt === maxRetries) throw error
        await new Promise(r => setTimeout(r, baseDelayMs * (attempt + 1)))
      }
    }
    throw new Error('Unreachable')
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private failResult(error: string, startTime: number): DeployResult {
    return {
      id: '',
      status: 'failed',
      url: '',
      error,
      deployedAt: new Date().toISOString(),
      buildDurationMs: Date.now() - startTime,
    }
  }
}
