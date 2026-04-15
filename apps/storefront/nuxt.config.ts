// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@commercejs/nuxt',
    '@commercejs/ui',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' },
      ],
      meta: [
        { property: 'og:site_name', content: 'CommerceJS Store' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },

  // CommerceJS module options — remote mode (proxies to a hosted
  // CommerceJS Cloud tenant). The storefront is a pure client of the
  // hosted API; no local adapter, no DB connection.
  //
  // At runtime, point at a merchant via:
  //   NUXT_COMMERCE_REMOTE_API_BASE=https://{merchant}.commercejs.cloud/api/storefront
  //   NUXT_COMMERCE_API_KEY=cjs_live_xxx         (optional; for API-key auth)
  commerce: {
    apiRoutes: false,
    apiBase: '/api/storefront',
  },

  // Runtime config — Google Maps key for the delivery-location picker.
  // Merchant-specific config (name / locale / direction) is resolved
  // per-render via `useStoreInfo()` in app.vue — runtimeConfig is frozen
  // at boot on Nitro so we can't cache it there.
  runtimeConfig: {
    public: {
      googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
    },
  },

  // Route caching — static assets only. Page-level SWR is disabled
  // because Nitro's SWR keys by URL path only (no vary-by-host), which
  // would serve merchant A's rendered HTML to merchant B on the
  // multi-tenant CommerceJS Cloud deploy (every subdomain hits the same
  // process). Revisit with a cache key that includes the merchant host
  // when needed.
  routeRules: {
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  },

  // Nitro — Fly.io / self-hosted node preset (was `cloudflare-pages`).
  nitro: {
    preset: 'node-server',
  },

  devtools: { enabled: true },
})