// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@commercejs/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
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
    adapter: 'salla',
    apiBase: '/api/_commerce',
    apiRoutes: true,
  },

  // Runtime config for Salla credentials (from .env)
  runtimeConfig: {
    sallaToken: process.env.SALLA_TOKEN || '',
    sallaRefreshToken: process.env.SALLA_REFRESH_TOKEN || '',
    sallaClientId: process.env.SALLA_CLIENT_ID || '',
    sallaClientSecret: process.env.SALLA_CLIENT_SECRET || '',
  },

  devtools: { enabled: true },
})