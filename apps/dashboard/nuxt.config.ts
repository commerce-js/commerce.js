// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-02-16',

  // Nuxt 4 features
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/ui',
    '@nuxthub/core',
  ],

  css: ['~/assets/css/main.css'],

  // NuxtHub features — Cloudflare D1, R2, KV
  hub: {
    database: true,
    blob: true,
    kv: true,
  },

  // Nitro preset for Cloudflare
  nitro: {
    preset: 'cloudflare-pages',
  },

  // App metadata
  app: {
    head: {
      title: 'CommerceJS Cloud',
      meta: [
        { name: 'description', content: 'Deploy and manage commerce stores in the cloud' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@300..900&display=swap' },
      ],
    },
  },

  // Runtime config — populated from env vars
  runtimeConfig: {
    cloudflareApiToken: '',
    cloudflareAccountId: '',
    neonApiKey: '',
    neonProjectId: '',
    githubAppId: '',
    githubAppPrivateKey: '',
    sessionPassword: '',
    oauth: {
      github: {
        clientId: '',
        clientSecret: '',
      },
    },
    public: {
      appTitle: 'CommerceJS Cloud',
    },
  },
})
