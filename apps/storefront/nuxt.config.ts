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
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' },
      ],
    },
  },

  // CommerceJS module options
  commerce: {
    adapter: 'platform',
    apiBase: '/api/_commerce',
    apiRoutes: true,
  },

  // Runtime config is handled by @commercejs/nuxt module
  // (runtimeConfig.commerce.* auto-mapped from NUXT_COMMERCE_* env vars)

  // Nitro — Cloudflare Pages preset
  nitro: {
    preset: 'cloudflare-pages',
  },

  devtools: { enabled: true },
})