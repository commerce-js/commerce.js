// ---------------------------------------------------------------------------
// commercejs deploy — deploy a CommerceJS store to the cloud
// ---------------------------------------------------------------------------

import { defineCommand } from 'citty'
import { consola } from 'consola'
import { DeployOrchestrator } from '@commercejs/cloud'
import { loadCloudConfig } from '../utils/config.js'

export const deployCommand = defineCommand({
  meta: {
    name: 'deploy',
    description: 'Deploy your CommerceJS store to the cloud',
  },
  args: {
    env: {
      type: 'string',
      description: 'Target environment (production, staging, preview)',
      default: 'production',
      alias: 'e',
    },
    branch: {
      type: 'string',
      description: 'Git branch to deploy',
      alias: 'b',
    },
    pr: {
      type: 'string',
      description: 'PR number for preview deployments',
    },
  },
  async run({ args }) {
    const environment = args.env as 'production' | 'staging' | 'preview'

    consola.start(`Deploying to ${environment}...`)

    try {
      const config = await loadCloudConfig()
      const orchestrator = new DeployOrchestrator(config)

      const result = await orchestrator.deploy({
        projectId: config.projectId ?? 'default',
        environment,
        branch: args.branch,
        prNumber: args.pr ? Number(args.pr) : undefined,
      })

      if (result.status === 'ready') {
        consola.success(`Deployed to ${result.url}`)
        consola.info(`Build time: ${result.buildDurationMs}ms`)
      }
      else {
        consola.error(`Deployment failed: ${result.error}`)
        process.exit(1)
      }
    }
    catch (error) {
      consola.error('Deploy failed:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  },
})
