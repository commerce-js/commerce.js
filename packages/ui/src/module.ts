import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
  installModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface CommerceUIModuleOptions {
  /**
   * Prefix for all commerce UI components.
   * @default 'C'
   * @example 'Commerce' → <CommerceProductCard />
   * @example 'U' → <UProductCard /> (for upstream Nuxt UI)
   */
  prefix?: string
}

const commerceUIModule: NuxtModule<CommerceUIModuleOptions> = defineNuxtModule<CommerceUIModuleOptions>({
  meta: {
    name: '@commercejs/ui',
    configKey: 'commerceUI',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    prefix: 'C',
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const prefix = options.prefix || 'C'

    // Ensure @nuxt/ui is installed
    await installModule('@nuxt/ui')

    // Register all ecommerce components with the configured prefix
    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix,
      // Scan subdirectories (product/, cart/, etc.)
      pathPrefix: false,
    })

    // Force Nitro to inline @commercejs/ui runtime files in the SSR bundle.
    // Without this, Nuxt's auto-import transform (computed, ref, useAppConfig, etc.)
    // does not apply to files in node_modules, causing ReferenceError on CF Workers.
    nuxt.hook('nitro:config', (nitroConfig: any) => {
      nitroConfig.externals = nitroConfig.externals || {}
      nitroConfig.externals.inline = nitroConfig.externals.inline || []
      nitroConfig.externals.inline.push('@commercejs/ui')
    })

    // Also add to Vite's transpile list so Vue SFC auto-imports work
    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    if (!nuxt.options.build.transpile.includes('@commercejs/ui')) {
      nuxt.options.build.transpile.push('@commercejs/ui')
    }

    // Extend app.config with default theme definitions
    nuxt.hook('app:resolve', (app) => {
      app.configs.push(resolve('./runtime/app.config'))
    })
  },
})

export default commerceUIModule
