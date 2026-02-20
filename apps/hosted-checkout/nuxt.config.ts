// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  app: {
    head: {
      title: 'Checkout — CommerceJS',
      meta: [
        { name: 'description', content: 'Secure hosted checkout powered by CommerceJS' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
      ],
    },
  },

  // Tap's goSell.js is loaded via useHead in the payment step
  // No extra modules needed — this is a minimal, focused checkout app

  runtimeConfig: {
    // Database URL for shared Neon DB
    databaseUrl: process.env.DATABASE_URL || '',
    // Store currency
    commerceCurrency: process.env.COMMERCE_CURRENCY || 'BHD',
    // Merchant's Tap secret key — per-merchant in production
    tapSecretKey: process.env.TAP_SECRET_KEY || '',
    // Webhook secret for Tap
    tapWebhookSecret: process.env.TAP_WEBHOOK_SECRET || '',
    // Public config
    public: {
      // Tap publishable key for goSell.js
      tapPublicKey: process.env.TAP_PUBLIC_KEY || '',
      // Base URL for redirect callbacks
      appUrl: process.env.APP_URL || 'http://localhost:3100',
    },
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },

  // Nitro — Cloudflare Pages preset
  nitro: {
    preset: 'cloudflare-pages',
  },
})
