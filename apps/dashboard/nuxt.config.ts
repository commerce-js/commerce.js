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

  // Runtime config — populated from env vars on Fly.
  // NOTE: NEON_CONTROL_DB_URL is read directly via process.env in
  // server/utils/db.ts (the canonical name lives in the monorepo-root
  // .secrets file). Anything that needs to be exposed to Vue components
  // belongs under `public:` and follows Nuxt's NUXT_<KEY> convention.
  runtimeConfig: {
    neonApiKey: '',
    sessionPassword: '',
    redisUrl: '',
    // Tap (https://tap.company) — MENA-first payment provider used both
    // for billing merchants for their platform subscription AND by stores
    // to charge buyers (via @commercejs/payment-tap; fully wired in
    // apps/hosted-checkout). Env-var names match the .secrets canonical
    // layer so the dashboard + hosted-checkout share one Tap account.
    tapSecretKey: process.env.TAP_SECRET_KEY || '',
    tapWebhookSecret: process.env.TAP_WEBHOOK_SECRET || '',
    public: {
      appTitle: 'CommerceJS Cloud',
      baseUrl: 'http://localhost:3002',
      tapPublicKey: process.env.TAP_PUBLIC_KEY || '',
    },
  },
})
