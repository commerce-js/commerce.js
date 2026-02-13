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

  // Runtime config for platform adapter (from .env)
  runtimeConfig: {
    commerceAdapter: 'platform',
    commerceDbPath: process.env.COMMERCE_DB_PATH || './store.db',
  },

  // Nitro server config — externalize native + platform modules
  // @commercejs/platform must NOT be bundled by Nitro's rollup so that
  // the Prisma singleton is shared across the server plugin and API route handlers.
  nitro: {
    externals: {
      external: [
        '@commercejs/platform',
        'better-sqlite3',
        '@prisma/adapter-better-sqlite3',
      ],
    },
  },

  devtools: { enabled: true },
})