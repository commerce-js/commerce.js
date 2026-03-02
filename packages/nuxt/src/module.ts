import { resolve } from 'path'
import { readdirSync, statSync, existsSync } from 'fs'
import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addServerHandler,
  addServerImportsDir,
  addTypeTemplate,
  addServerPlugin,
  installModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { consola } from 'consola'
const logger = consola.withTag('@commercejs/nuxt')

/**
 * Recursively discover route handler files and register them via addServerHandler.
 *
 * Published Nuxt modules can't rely on addServerScanDir because:
 * 1. Auto-imports don't work in node_modules (route files need explicit imports)
 * 2. Compile-time macros like defineRouteMeta aren't stripped from pre-compiled dist files
 *
 * This function scans the dist/runtime/server/api directory and registers each
 * route file explicitly with its HTTP method and route path.
 */
function registerApiRoutes(apiDir: string, basePath: string = '/api') {
  if (!existsSync(apiDir)) {
    logger.warn(`API routes directory not found: ${apiDir}`)
    return 0
  }

  let count = 0

  function scan(dir: string, routePrefix: string) {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = resolve(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Convert directory [param] to :param for route
        const dirRoute = entry.startsWith('[') && entry.endsWith(']')
          ? `:${entry.slice(1, -1)}`
          : entry
        scan(fullPath, `${routePrefix}/${dirRoute}`)
        continue
      }

      // Only process .ts/.js/.mjs files, skip .d.ts
      if (!entry.match(/\.(ts|js|mjs)$/) || entry.endsWith('.d.ts')) continue

      // Parse filename: name.method.ts → { name, method }
      // e.g. store.get.ts → route: /store, method: GET
      // e.g. index.post.ts → route: /, method: POST
      const parts = entry.replace(/\.(ts|js|mjs)$/, '').split('.')
      const method = parts.length > 1 ? parts.pop()!.toUpperCase() : undefined
      const name = parts.join('.')

      // Build route path
      let routePath: string
      if (name === 'index') {
        routePath = routePrefix || '/'
      } else {
        // Convert [param] in filename to :param
        const routeName = name.startsWith('[') && name.endsWith(']')
          ? `:${name.slice(1, -1)}`
          : name
        routePath = `${routePrefix}/${routeName}`
      }

      // Strip file extension for handler path (Nuxt Kit resolves it)
      const handlerPath = fullPath.replace(/\.(ts|js|mjs)$/, '')

      addServerHandler({
        route: routePath,
        method: method as any,
        handler: handlerPath,
      })
      count++
    }
  }

  scan(apiDir, basePath)
  return count
}

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

    // Server-side runtime config for secrets (auto-mapped from NUXT_COMMERCE_* env vars)
    // Defaults are set first; the spread of existing runtimeConfig goes LAST so
    // environment variables (e.g. NUXT_COMMERCE_DATABASE_URL) always override defaults.
    nuxt.options.runtimeConfig.commerce = {
      adapter: options.adapter || '',  // default from module options
      databaseUrl: '',                 // NUXT_COMMERCE_DATABASE_URL
      currency: '',                    // NUXT_COMMERCE_CURRENCY
      sallaToken: '',                  // NUXT_COMMERCE_SALLA_TOKEN
      sallaRefreshToken: '',           // NUXT_COMMERCE_SALLA_REFRESH_TOKEN
      sallaClientId: '',               // NUXT_COMMERCE_SALLA_CLIENT_ID
      sallaSecret: '',                 // NUXT_COMMERCE_SALLA_SECRET
      sallaLocale: '',                 // NUXT_COMMERCE_SALLA_LOCALE
      ...nuxt.options.runtimeConfig.commerce as any,
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

    // Register server API routes via explicit addServerHandler calls.
    // Published Nuxt modules can NOT use addServerScanDir because:
    //   1. Auto-imports don't resolve in node_modules
    //   2. Compile-time macros (defineRouteMeta) aren't stripped from pre-compiled dist
    // Instead, we scan the dist/api directory and register each handler explicitly.
    if (options.apiRoutes) {
      const apiDir = resolve('./runtime/server/api')
      const routeCount = registerApiRoutes(apiDir, '/api')
      logger.info(`Registered ${routeCount} server routes under ${options.apiBase}`)

      // Register server utils (defineCommerceHandler, useServerAdapter, etc.)
      // so they're available as auto-imports for user-defined routes
      addServerImportsDir(resolve('./runtime/server/utils'))
    }

    // Note: WASM handling was removed — Drizzle uses @neondatabase/serverless
    // (HTTP-based, no WASM binary needed) so no unwasm or patch-wasm.mjs required.
    // The platform build script removes dist/database/prisma/ to prevent stale
    // Prisma generated code from being bundled.

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
