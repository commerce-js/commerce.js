// ---------------------------------------------------------------------------
// commercejs init — scaffold a new CommerceJS project
// ---------------------------------------------------------------------------

import { defineCommand } from 'citty'
import { consola } from 'consola'

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Scaffold a new CommerceJS project',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Project name',
      required: false,
    },
    template: {
      type: 'string',
      description: 'Storefront template to use',
      default: 'default',
      alias: 't',
    },
    adapter: {
      type: 'string',
      description: 'Commerce adapter (platform, salla, medusa)',
      default: 'platform',
      alias: 'a',
    },
  },
  async run({ args }) {
    const name = args.name || 'my-store'

    consola.start(`Scaffolding "${name}" with ${args.adapter} adapter...`)

    try {
      // TODO: Use giget to clone template from GitHub
      // const templateUrl = `github:commerce-js/templates/${args.template}`
      // await downloadTemplate(templateUrl, { dir: name })

      consola.box({
        title: 'CommerceJS Store Created',
        message: [
          `  Project: ${name}`,
          `  Adapter: ${args.adapter}`,
          `  Template: ${args.template}`,
          '',
          '  Next steps:',
          `  cd ${name}`,
          '  pnpm install',
          '  pnpm dev',
          '',
          '  Deploy when ready:',
          '  commercejs deploy',
        ].join('\n'),
      })
    }
    catch (error) {
      consola.error('Init failed:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  },
})
