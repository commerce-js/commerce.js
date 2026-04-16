// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  app: {
    // Namespace checkout assets to avoid collisions with the dashboard
    // (/_nuxt/) and storefront (/_storefront/) when co-supervised on the
    // same Fly machine.
    buildAssetsDir: '/_checkout/',
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

  // Tap Card SDK v2 is loaded dynamically via useTapCard composable
  // No extra modules needed — this is a minimal, focused checkout app

  runtimeConfig: {
    // Control DB — used by the tenant middleware to resolve the merchant
    // row (subdomain → database_url) so the checkout can connect to the
    // right merchant's Neon branch. See server/middleware/tenant.ts.
    neonControlDbUrl: process.env.NEON_CONTROL_DB_URL || '',
    // Legacy single-tenant DB URL — kept for backward compat in dev.
    // In production (multi-tenant), the tenant middleware overrides this
    // per-request via getPrismaClient + bindDb.
    databaseUrl: process.env.DATABASE_URL || '',
    // Store currency — per-merchant in production, env fallback for MVP
    commerceCurrency: process.env.COMMERCE_CURRENCY || 'SAR',
    // Merchant's Tap secret key — per-merchant in production
    tapSecretKey: process.env.TAP_SECRET_KEY || '',
    // Webhook secret for Tap
    tapWebhookSecret: process.env.TAP_WEBHOOK_SECRET || '',
    // Public config
    public: {
      // Tap publishable key for goSell.js
      tapPublicKey: process.env.TAP_PUBLIC_KEY || '',
      // Base URL for redirect callbacks
      appUrl: process.env.APP_URL || 'https://checkout.commercejs.cloud',
      // Google Maps JavaScript API key
      googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
    },
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },

  nitro: {
    preset: 'node-server',
    // Required for `useEvent()` in server/plugins/platform-event-resolver.ts
    // — lets @commercejs/platform's getDb() read the current request's
    // Prisma client off event.context.db across the middleware→handler
    // boundary. Without this flag, useEvent() throws outside handlers.
    experimental: {
      asyncContext: true,
    },
  },
})
