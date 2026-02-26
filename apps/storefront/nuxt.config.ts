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

  // CommerceJS module options
  commerce: {
    adapter: 'platform',
    apiBase: '/api/_commerce',
    apiRoutes: true,
  },

  // Runtime config — Google Maps for delivery location
  runtimeConfig: {
    public: {
      googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
    },
  },

  // Route caching — CDN performance
  routeRules: {
    '/': { swr: 3600 },
    '/products/**': { swr: 600 },
    '/categories/**': { swr: 600 },
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  },

  // Runtime config is handled by @commercejs/nuxt module
  // (runtimeConfig.commerce.* auto-mapped from NUXT_COMMERCE_* env vars)

  // Nitro — Cloudflare Pages preset
  nitro: {
    preset: 'cloudflare-pages',
  },

  devtools: { enabled: true },
})