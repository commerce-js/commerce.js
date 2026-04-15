// Minimal playground to smoke-test remote mode against a live
// CommerceJS Cloud tenant.
//
//   NUXT_COMMERCE_REMOTE_API_BASE=https://smoke.commercejs.cloud/api/storefront \
//   pnpm --filter @commercejs/nuxt dev
//
// Then: curl http://localhost:3000/api/storefront/products
export default defineNuxtConfig({
  modules: ['../src/module'],
  compatibilityDate: '2025-07-15',
  commerce: {
    // remoteApiBase is populated from NUXT_COMMERCE_REMOTE_API_BASE at runtime
  },
  nitro: {
    preset: 'node-server',
  },
  devtools: { enabled: false },
})
