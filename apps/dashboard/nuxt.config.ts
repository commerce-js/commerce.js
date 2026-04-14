// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-02-16',

  // Nuxt 4 features
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/ui',
    // NO @nuxthub/core — Cloudflare-only, replaced by Prisma + Neon on fly/eaas
  ],

  css: ['~/assets/css/main.css'],

  // NO hub config on fly/eaas — control DB is plain Prisma/Postgres

  // Nitro preset for Fly.io (standard Node.js)
  nitro: {
    preset: 'node-server',
  },

  // Allow tunnel hosts in dev
  devServer: {
    host: '0.0.0.0',
  },

  // App metadata
  app: {
    head: {
      title: 'CommerceJS Cloud',
      meta: [
        { name: 'description', content: 'Ecommerce as a Service — deploy stores instantly' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@300..900&display=swap' },
      ],
    },
  },

  // Runtime config — populated from env vars on Fly
  runtimeConfig: {
    controlDatabaseUrl: '',
    neonApiKey: '',
    sessionPassword: '',
    redisUrl: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    public: {
      appTitle: 'CommerceJS Cloud',
      // Dashboard base URL
      baseUrl: 'http://localhost:3002',
    },
  },
})
