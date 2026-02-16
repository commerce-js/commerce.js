// ---------------------------------------------------------------------------
// CommerceJS Cloud — Types
// ---------------------------------------------------------------------------

/**
 * Cloud project — a deployed CommerceJS store.
 */
export interface CloudProject {
  /** Unique project ID */
  id: string
  /** Human-readable project name (e.g. "my-store") */
  name: string
  /** Project owner ID */
  ownerId: string
  /** GitHub repository URL (if connected) */
  repoUrl?: string
  /** Custom domain (e.g. "store.example.com") */
  customDomain?: string
  /** Default cloud subdomain (e.g. "my-store.commercejs.cloud") */
  subdomain: string
  /** Current production deployment ID */
  productionDeploymentId?: string
  /** Project-level environment variables */
  envVars: Record<string, string>
  /** Billing plan tier */
  plan: 'starter' | 'pro' | 'enterprise'
  /** When the project was created */
  createdAt: string
  /** When the project was last updated */
  updatedAt: string
}

/**
 * A deployment environment — production, staging, or preview.
 */
export interface CloudEnvironment {
  /** Environment name (e.g. 'production', 'staging', 'preview', 'pr-123') */
  name: string
  /** Cloudflare Pages deployment URL */
  url: string
  /** Neon Postgres branch ID */
  dbBranchId: string
  /** Neon connection string */
  dbConnectionString: string
  /** R2 bucket name for assets */
  r2Bucket: string
  /** KV namespace ID for sessions/cache */
  kvNamespaceId: string
  /** Git branch this environment tracks */
  gitBranch?: string
  /** Associated PR number (for preview envs) */
  prNumber?: number
}

/**
 * Configuration for deploying a store.
 */
export interface DeployConfig {
  /** Project ID to deploy */
  projectId: string
  /** Target environment */
  environment: 'production' | 'staging' | 'preview'
  /** Git branch to deploy from */
  branch?: string
  /** Git commit SHA */
  commitSha?: string
  /** Environment variables to set */
  envVars?: Record<string, string>
  /** PR number (for preview deployments) */
  prNumber?: number
}

/**
 * Result of a deployment.
 */
export interface DeployResult {
  /** Deployment ID */
  id: string
  /** Deployment status */
  status: 'building' | 'deploying' | 'ready' | 'failed'
  /** Deployed URL */
  url: string
  /** Build log URL */
  buildLogUrl?: string
  /** Error message if failed */
  error?: string
  /** Deployment timestamp */
  deployedAt: string
  /** Build duration in ms */
  buildDurationMs?: number
}

/**
 * Cloudflare provider configuration.
 */
export interface CloudflareConfig {
  /** Cloudflare API token */
  apiToken: string
  /** Cloudflare account ID */
  accountId: string
}

/**
 * Neon provider configuration.
 */
export interface NeonConfig {
  /** Neon API key */
  apiKey: string
  /** Neon project ID (shared across all tenants, or one per tenant) */
  projectId?: string
}

/**
 * GitHub provider configuration.
 */
export interface GitHubConfig {
  /** GitHub App ID */
  appId: string
  /** GitHub App private key */
  privateKey: string
  /** GitHub App installation ID (per user) */
  installationId?: string
}

/**
 * Billing provider configuration.
 */
export interface BillingConfig {
  /** Tap Payments secret key (GCC) */
  tapSecretKey?: string
  /** Stripe secret key (international) */
  stripeSecretKey?: string
  /** Default billing region */
  defaultRegion?: 'gcc' | 'international'
}

/**
 * Full cloud configuration.
 */
export interface CloudConfig {
  cloudflare: CloudflareConfig
  neon: NeonConfig
  github?: GitHubConfig
  billing?: BillingConfig
}
