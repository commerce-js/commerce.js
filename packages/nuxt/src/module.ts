import { resolve } from 'path'
import { readdirSync, statSync, existsSync, readFileSync } from 'fs'
import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addServerHandler,
  addServerImportsDir,
  addTypeTemplate,
  addServerPlugin,
  addTemplate,
  installModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { consola } from 'consola'
const logger = consola.withTag('@commercejs/nuxt')

/**
 * Rewrite all import statements in compiled handler code to use `#imports`.
 *
 * Route handlers import utilities like `defineCommerceHandler`, `useAdminAPI`,
 * etc. from package-relative paths. When these explicit imports coexist with
 * Nitro's auto-import system, Rollup sees two separate module identities for
 * the same function — the package's copy and Nitro's auto-imported copy.
 *
 * On CF Workers, Rollup resolves this collision by renaming one copy with a
 * `$1` suffix (e.g., `defineCommerceHandler$1`). But handler code still
 * references the original name → `ReferenceError` at runtime.
 *
 * This also cascades: even if `defineCommerceHandler` is fixed, its internal
 * `import { defineEventHandler } from 'h3'` creates the same dual-identity
 * problem for h3 functions.
 *
 * Solution: rewrite ALL imports to use `#imports` — Nitro's virtual module
 * that provides a single, deduplicated copy of every auto-imported function.
 * Since `addServerImportsDir` registers all our utils, `#imports` resolves
 * everything through Nitro's unified module graph.
 *
 * @param code - The handler source code
 */
function rewriteToAutoImports(code: string): string {
  // Collect all named imports from all import statements
  const namedImports: string[] = []

  // Match: import { foo, bar } from '...'
  // Match: import { foo } from '...'
  const importRegex = /^import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];?\s*$/gm
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = importRegex.exec(code)) !== null) {
    const names = match[1].split(',').map(n => n.trim()).filter(Boolean)
    namedImports.push(...names)
  }

  if (namedImports.length === 0) return code

  // Remove all original import statements
  const cleaned = code.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '')

  // Add single consolidated import from #imports
  return `import { ${namedImports.join(', ')} } from '#imports';\n${cleaned}`
}

/**
 * Recursively discover route handler files and register them as virtual
 * template files via addTemplate + addServerHandler.
 *
 * Published Nuxt modules can't point addServerHandler directly at files
 * in node_modules because Rollup can't resolve relative imports between
 * files inside node_modules during Nitro's CF Workers bundling.
 *
 * Instead, this function:
 * 1. Scans the dist/runtime/server/api directory for compiled .js handlers
 * 2. Reads each handler's content
 * 3. Strips relative imports (auto-imports replace them)
 * 4. Generates a template file in .nuxt/ via addTemplate
 * 5. Points addServerHandler at the generated template
 */
function registerApiRoutes(apiDir: string, basePath: string = '/api') {
  if (!existsSync(apiDir)) {
    logger.warn(`API routes directory not found: ${apiDir}`)
    return 0
  }

  let count = 0

  function scan(dir: string, routePrefix: string, templatePrefix: string) {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = resolve(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Convert directory [param] to :param for route
        const dirRoute = entry.startsWith('[') && entry.endsWith(']')
          ? `:${entry.slice(1, -1)}`
          : entry
        scan(fullPath, `${routePrefix}/${dirRoute}`, `${templatePrefix}/${entry}`)
        continue
      }

      // Only process .js files (compiled output), skip .d.ts
      if (!entry.endsWith('.js') || entry.endsWith('.d.ts')) continue

      // Parse filename: name.method.js → { name, method }
      // e.g. store.get.js → route: /store, method: GET
      // e.g. index.post.js → route: /, method: POST
      const parts = entry.replace(/\.js$/, '').split('.')
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

      // Read the handler source, strip import statements since Nitro auto-imports
      // provide everything (defineCommerceHandler, useAdminAPI, etc.)
      const handlerSource = readFileSync(fullPath, 'utf-8')
      const cleanedSource = rewriteToAutoImports(handlerSource)

      // Generate a unique template filename for this handler
      const templateFilename = `commerce-api${templatePrefix}/${entry}`

      // Generate a virtual file in .nuxt/ via addTemplate
      const template = addTemplate({
        filename: templateFilename,
        write: true,
        getContents: () => cleanedSource,
      })

      addServerHandler({
        route: routePath,
        method: method as any,
        handler: template.dst,
      })
      count++
    }
  }

  scan(apiDir, basePath, '')
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

    // Force Nitro to bundle @commercejs/nuxt runtime files instead of
    // externalizing them. Generated route templates import utils via absolute
    // paths that resolve to node_modules — without inlining, these would be
    // externalized and the imports would fail on CF Workers.
    nuxt.hook('nitro:config', (nitroConfig: any) => {
      nitroConfig.externals = nitroConfig.externals || {}
      nitroConfig.externals.inline = nitroConfig.externals.inline || []
      nitroConfig.externals.inline.push('@commercejs/nuxt')
    })

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

    // Register server utils for auto-imports (defineCommerceHandler, useAdminAPI, etc.)
    // MUST be registered before API routes so auto-imports work in generated templates
    addServerImportsDir(resolve('./runtime/server/utils'))
    addServerImportsDir(resolve('./runtime/server/data'))

    // Register server API routes as virtual template files in .nuxt/
    // Route handlers are read from dist/, relative imports stripped (auto-imports
    // replace them), and generated as template files that go through Nitro's
    // full bundling pipeline. This is required because Rollup can't resolve
    // relative imports between files in node_modules during CF Workers bundling.
    if (options.apiRoutes) {
      const apiDir = resolve('./runtime/server/api')
      const routeCount = registerApiRoutes(apiDir, '/api')
      logger.info(`Registered ${routeCount} server routes under ${options.apiBase}`)
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
