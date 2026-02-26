// ---------------------------------------------------------------------------
// commercejs deploy — deploy a CommerceJS store to the cloud
// ---------------------------------------------------------------------------

import { defineCommand } from 'citty'
import { consola } from 'consola'
import { resolve } from 'node:path'
import { DeployOrchestrator } from '@commercejs/cloud'
import { loadCloudConfig } from '../utils/config.js'

export const deployCommand = defineCommand({
  meta: {
    name: 'deploy',
    description: 'Deploy your CommerceJS store to the cloud',
  },
  args: {
    dir: {
      type: 'string',
      description: 'Project directory to deploy (defaults to current directory)',
      default: '.',
      alias: 'd',
    },
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
    project: {
      type: 'string',
      description: 'Project ID (overrides config)',
      alias: 'p',
    },
  },
  async run({ args }) {
    const environment = args.env as 'production' | 'staging' | 'preview'
    const projectDir = resolve(args.dir)

    consola.start(`Deploying to ${environment}...`)
    consola.info(`Project directory: ${projectDir}`)

    try {
      const config = await loadCloudConfig()
      const orchestrator = new DeployOrchestrator(config)
      const projectId = args.project || config.projectId || 'default'

      const result = await orchestrator.deploy({
        projectId,
        projectDir,
        environment,
        branch: args.branch,
        prNumber: args.pr ? Number(args.pr) : undefined,
      })

      if (result.status === 'ready') {
        consola.success(`\n🚀 Deployed to ${result.url}`)
        consola.info(`   Build time: ${Math.round(result.buildDurationMs! / 1000)}s`)
        consola.info(`   Deployment ID: ${result.id}`)
      }
      else {
        consola.error(`\n❌ Deployment failed: ${result.error}`)
        process.exit(1)
      }
    }
    catch (error) {
      consola.error('Deploy failed:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  },
})
