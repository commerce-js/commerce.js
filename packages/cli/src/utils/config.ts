// ---------------------------------------------------------------------------
// CLI utilities — config loading
// ---------------------------------------------------------------------------

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { consola } from 'consola'
import type { CloudConfig } from '@commercejs/cloud'

interface ExtendedCloudConfig extends CloudConfig {
  projectId?: string
}

/**
 * Load cloud configuration from `commercejs.config.json` or environment variables.
 *
 * Configuration resolution order:
 * 1. `commercejs.config.json` in the project root
 * 2. Environment variables (CLOUDFLARE_API_TOKEN, NEON_API_KEY, etc.)
 */
export async function loadCloudConfig(): Promise<ExtendedCloudConfig> {
  // Try loading from config file
  const configPath = resolve(process.cwd(), 'commercejs.config.json')

  try {
    const raw = await readFile(configPath, 'utf-8')
    const config = JSON.parse(raw) as ExtendedCloudConfig
    consola.debug(`Loaded config from ${configPath}`)
    return config
  }
  catch {
    // Fall back to environment variables
  }

  // Load from environment variables
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const neonApiKey = process.env.NEON_API_KEY

  if (!apiToken || !accountId) {
    consola.error(
      'Missing configuration. Either create a commercejs.config.json or set environment variables:\n'
      + '  CLOUDFLARE_API_TOKEN\n'
      + '  CLOUDFLARE_ACCOUNT_ID\n'
      + '  NEON_API_KEY',
    )
    process.exit(1)
  }

  return {
    projectId: process.env.COMMERCEJS_PROJECT_ID,
    cloudflare: {
      apiToken,
      accountId,
    },
    neon: {
      apiKey: neonApiKey ?? '',
      projectId: process.env.NEON_PROJECT_ID,
    },
    github: process.env.GITHUB_APP_ID
      ? {
          appId: process.env.GITHUB_APP_ID,
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY ?? '',
          installationId: process.env.GITHUB_INSTALLATION_ID,
        }
      : undefined,
    billing: process.env.TAP_SECRET_KEY || process.env.STRIPE_SECRET_KEY
      ? {
          tapSecretKey: process.env.TAP_SECRET_KEY,
          stripeSecretKey: process.env.STRIPE_SECRET_KEY,
          defaultRegion: (process.env.BILLING_REGION as 'gcc' | 'international') ?? 'gcc',
        }
      : undefined,
  }
}
