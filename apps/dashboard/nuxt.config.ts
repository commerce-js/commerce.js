// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-02-16',

  // Nuxt 4 features
  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxt/ui'],

  // App metadata
  app: {
    head: {
      title: 'CommerceJS Cloud',
      meta: [
        { name: 'description', content: 'Deploy and manage commerce stores in the cloud' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  // Runtime config — populated from env vars
  runtimeConfig: {
    cloudflareApiToken: '',
    cloudflareAccountId: '',
    neonApiKey: '',
    githubAppId: '',
    githubAppPrivateKey: '',
    public: {
      appTitle: 'CommerceJS Cloud',
    },
  },
})
