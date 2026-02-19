import { dirname, resolve } from 'path'
import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addServerScanDir,
  addTypeTemplate,
  addServerPlugin,
  installModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { consola } from 'consola'
import { unwasm } from 'unwasm/plugin'
const logger = consola.withTag('@commercejs/nuxt')

export interface CommerceModuleOptions {
  /**
   * The adapter to use (e.g., 'salla', 'zid', 'shopify', 'medusa').
   * The adapter package must be installed separately.
   */
  adapter?: string

  /**
   * Base path for auto-generated REST API routes.
   * @default '/api/_commerce'
   */
  apiBase?: string

  /**
   * Whether to register auto-generated REST API routes.
   * @default true
   */
  apiRoutes?: boolean

  /**
   * Enable OpenAPI spec generation (/_openapi.json, /_scalar, /_swagger).
   * @default true
   */
  openAPI?: boolean
}

const commerceModule: NuxtModule<CommerceModuleOptions> = defineNuxtModule<CommerceModuleOptions>({
  meta: {
    name: '@commercejs/nuxt',
    configKey: 'commerce',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    apiBase: '/api/_commerce',
    apiRoutes: true,
    openAPI: true,
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    logger.info('Initializing CommerceJS module...')

    // Register nuxt-auth-utils for admin session support
    await installModule('nuxt-auth-utils')

    // Expose options via runtime config
    nuxt.options.runtimeConfig.public.commerce = {
      adapter: options.adapter || '',
      apiBase: options.apiBase || '/api/_commerce',
    }

    // Server-side runtime config for secrets (auto-mapped from NUXT_* env vars)
    nuxt.options.runtimeConfig.commerce = {
      ...nuxt.options.runtimeConfig.commerce as any,
      databaseUrl: '',        // NUXT_COMMERCE_DATABASE_URL
      adapter: '',            // NUXT_COMMERCE_ADAPTER
      currency: '',           // NUXT_COMMERCE_CURRENCY
      sallaToken: '',         // NUXT_COMMERCE_SALLA_TOKEN
      sallaRefreshToken: '',  // NUXT_COMMERCE_SALLA_REFRESH_TOKEN
      sallaClientId: '',      // NUXT_COMMERCE_SALLA_CLIENT_ID
      sallaSecret: '',        // NUXT_COMMERCE_SALLA_SECRET
      sallaLocale: '',        // NUXT_COMMERCE_SALLA_LOCALE
    }

    // Add type augmentation for $commerce on NuxtApp
    addTypeTemplate({
      filename: 'types/commercejs.d.ts',
      getContents: () => `
        import type { CommerceAdapter } from '@commercejs/types'

        declare module '#app' {
          interface NuxtApp {
            $commerce: CommerceAdapter
          }
        }

        declare module 'vue' {
          interface ComponentCustomProperties {
            $commerce: CommerceAdapter
          }
        }

        export {}
      `,
    })

    // Register the plugin that provides the adapter instance
    addPlugin(resolve('./runtime/plugin'))

    // Register the Nitro server plugin that injects the adapter into event.context
    addServerPlugin(resolve('./runtime/server/plugins/commerce-adapter'))

    // Auto-import composables
    addImportsDir(resolve('./runtime/composables'))

    // Register server API routes via Nitro's convention-based scanning
    // Routes are auto-discovered from runtime/server/api/_commerce/**/*.ts
    // e.g. api/_commerce/store.get.ts → GET /api/_commerce/store
    if (options.apiRoutes) {
      addServerScanDir(resolve('./runtime/server'))
      logger.info(`Server routes auto-discovered under ${options.apiBase}`)
    }

    // Enable WASM support — required for Prisma query compiler on Cloudflare Workers
    nuxt.options.nitro.experimental = {
      ...nuxt.options.nitro.experimental,
      wasm: true,
    }

    // Add unwasm as both a Vite and Nitro Rollup plugin
    const unwasmPlugin = unwasm({
      esmImport: true,
    })

    nuxt.options.vite.plugins = nuxt.options.vite.plugins || []
    nuxt.options.vite.plugins.push(unwasmPlugin)

    // Custom Rollup plugin to strip Cloudflare-specific ?module query from .wasm imports
    // Prisma's cloudflare runtime generates `.wasm?module` imports; unwasm only understands plain `.wasm`
    const wasmModulePlugin = {
      name: 'prisma-wasm-module-compat',
      resolveId(source: string, importer: string | undefined) {
        if (source.endsWith('.wasm?module')) {
          const stripped = source.replace('?module', '')
          if (importer) {
            return { id: resolve(dirname(importer), stripped), external: false }
          }
          return { id: stripped, external: false }
        }
        return null
      },
    }

    // Configure Nitro Rollup — the wasmModulePlugin must come before unwasm
    nuxt.options.nitro.rollupConfig = nuxt.options.nitro.rollupConfig || {}
    nuxt.options.nitro.rollupConfig.plugins = nuxt.options.nitro.rollupConfig.plugins || []
    ;(nuxt.options.nitro.rollupConfig.plugins as any[]).push(wasmModulePlugin, unwasmPlugin)

    // Enable OpenAPI spec generation (/_openapi.json, /_scalar, /_swagger)
    if (options.openAPI) {
      nuxt.options.nitro.experimental = {
        ...nuxt.options.nitro.experimental,
        openAPI: {
          meta: {
            title: 'CommerceJS API',
            description: 'Composable commerce REST API — auto-generated from @commercejs/nuxt',
            version: '1.0.0',
          },
          ui: {
            scalar: {
              theme: 'purple',
            },
          },
        },
      }
      logger.info('OpenAPI spec enabled (/_openapi.json, /_scalar)')
    }
  },
})

export default commerceModule
