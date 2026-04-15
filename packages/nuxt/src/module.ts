import {
  defineNuxtModule,
  addPlugin,
  addServerHandler,
  createResolver,
  addImportsDir,
  addTypeTemplate,
  addServerPlugin,
  addServerScanDir,
  installModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { consola } from 'consola'
const logger = consola.withTag('@commercejs/nuxt')

export interface CommerceModuleOptions {
  /**
   * The adapter to use (e.g., 'salla', 'zid', 'shopify', 'medusa').
   * The adapter package must be installed separately.
   */
  adapter?: string

  /**
   * Base path for the commerce API on THIS Nuxt app.
   *
   * - Local-route mode (`apiRoutes: true`): path where the 46 built-in
   *   route handlers are registered. Default: `/api/_commerce`.
   * - Remote-proxy mode (`remoteApiBase` set): path where the local
   *   proxy handler is registered. Default: `/api/storefront` (matches
   *   the shape exposed by CommerceJS Cloud).
   */
  apiBase?: string

  /**
   * Whether to register auto-generated REST API routes.
   * Forced to `false` when `remoteApiBase` is set.
   * @default true
   */
  apiRoutes?: boolean

  /**
   * Remote CommerceJS API base URL. When set, the module switches to
   * **remote mode**: no local route handlers, no adapter initialisation.
   * A catch-all proxy is installed at `apiBase` that forwards every
   * request to this URL. Composables keep calling the same local
   * `apiBase`, so browser traffic stays same-origin (no CORS).
   *
   * @example 'https://acme.commercejs.cloud/api/storefront'
   */
  remoteApiBase?: string

  /**
   * API key sent as `X-Commerce-Key` on every proxied request.
   * Only used in remote mode. Kept in private runtime config so it
   * never ships to the client bundle.
   */
  apiKey?: string

  /**
   * Enable OpenAPI spec generation (/_openapi.json, /_scalar, /_swagger).
   * Ignored in remote mode (no local routes to document).
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
    // apiBase intentionally unset — its default is mode-aware and resolved
    // in setup() ('/api/_commerce' in local mode, '/api/storefront' in remote).
    apiRoutes: true,
    openAPI: true,
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    logger.info('Initializing CommerceJS module...')

    // ------------------------------------------------------------------
    // Remote-mode detection
    // ------------------------------------------------------------------
    // Remote mode = "this app does not own the commerce data locally;
    // forward /api/${apiBase}/** to a hosted CommerceJS tenant instead."
    //
    // Two ways to opt in:
    //   1. Set commerce.apiRoutes: false in nuxt.config.ts (the build-
    //      time signal — used by apps/storefront in the EaaS deploy).
    //   2. Leave apiRoutes at the default and set commerce.remoteApiBase
    //      (or the NUXT_COMMERCE_REMOTE_API_BASE env var) — the module
    //      then forces apiRoutes: false for you.
    //
    // We key every mode-dependent decision on the final `apiRoutes`
    // value after resolution, NOT on whether remoteApiBase is visible
    // at build time — because in the T04 flow the env var is set
    // in fly.toml and isn't present when `nuxt build` runs. If we
    // keyed on remoteApiBase alone, the adapter server plugin would
    // still register at build time and crash at runtime trying to
    // initialise from missing Salla/Platform credentials.
    const envRemoteApiBase = process.env.NUXT_COMMERCE_REMOTE_API_BASE
    if (options.remoteApiBase || envRemoteApiBase) {
      options.apiRoutes = false
    }
    const remoteMode = options.apiRoutes === false

    // Resolve mode-aware default for apiBase (the module's `defaults`
    // intentionally omits this key — see the defineNuxtModule block).
    if (!options.apiBase) {
      options.apiBase = remoteMode ? '/api/storefront' : '/api/_commerce'
    }

    if (remoteMode) {
      const remoteHint = options.remoteApiBase
        || envRemoteApiBase
        || '(set NUXT_COMMERCE_REMOTE_API_BASE at runtime)'
      logger.info(`Remote mode — proxying ${options.apiBase}/** → ${remoteHint}`)
    }

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
      apiBase: options.apiBase,
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
      // Remote-mode config (server-only — never shipped to the client):
      remoteApiBase: options.remoteApiBase || '',  // NUXT_COMMERCE_REMOTE_API_BASE
      apiKey: options.apiKey || '',                // NUXT_COMMERCE_API_KEY
      // Also stash the local proxy prefix so the proxy handler can strip
      // it without re-reading public config (which lives on a different
      // key and would be leaked to the client bundle if referenced there).
      apiBase: options.apiBase,
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

    // The adapter server plugin initialises a CommerceAdapter from env
    // vars (Salla token / Platform DB URL). It only makes sense when
    // this app owns the commerce data (apiRoutes: true). In remote mode
    // — including the T04 flow where remoteApiBase is set from a runtime
    // env var the module didn't see at build time — apiRoutes is false
    // and the adapter would just fail to initialise. Key off apiRoutes
    // here so we get it right regardless of when remoteApiBase is set.
    if (options.apiRoutes) {
      addServerPlugin(resolve('./runtime/server/plugins/commerce-adapter'))
    }

    // Auto-import composables
    addImportsDir(resolve('./runtime/composables'))

    // Use addServerScanDir to tell Nitro to treat the package's server/
    // directory as the app's own server/ directory. This enables:
    // - Auto-import of utils/ (defineCommerceHandler, useAdminAPI, etc.)
    // - Auto-import of data/ (citiesByCountry, countryMeta)
    // - Auto-discovery of api/ route handlers with full auto-import injection
    // - Auto-import of h3 built-ins (defineEventHandler, createError, etc.)
    //
    // Handler source files have NO explicit imports — they rely entirely
    // on Nitro's auto-import system (the Nuxt server/utils pattern).
    if (options.apiRoutes) {
      addServerScanDir(resolve('./runtime/server'))
      logger.info(`Registered server scan directory for commerce API routes`)
    }

    // Remote mode — install a single catch-all proxy at apiBase/**
    // that forwards every request to remoteApiBase with the API key.
    // Same apiRoutes-keyed condition as the adapter plugin above so
    // the two stay mutually exclusive.
    if (remoteMode) {
      addServerHandler({
        route: `${options.apiBase}/**`,
        handler: resolve('./runtime/server/proxy'),
      })
      // Pair of plugins the proxy depends on (see those files for
      // detail). Split across two files so the remote-mode code path
      // stays self-contained.
      addServerPlugin(resolve('./runtime/server/plugins/proxy-forwarded-host'))
    }

    // Note: WASM handling was removed — Drizzle uses @neondatabase/serverless
    // (HTTP-based, no WASM binary needed) so no unwasm or patch-wasm.mjs required.
    // The platform build script removes dist/database/prisma/ to prevent stale
    // Prisma generated code from being bundled.

    // Enable OpenAPI spec generation (/_openapi.json, /_scalar, /_swagger)
    // No routes to document in remote mode — skip.
    if (options.openAPI && !remoteMode) {
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
