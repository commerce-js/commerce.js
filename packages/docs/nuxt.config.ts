// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms',
    '@nuxtjs/mcp-toolkit'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  components: [{
    path: '~/components',
    pathPrefix: false
  }],

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1
        }
      }
    }
  },

  hooks: {
    'content:file:beforeParse': async (ctx: { file: { id: string; body: string } }) => {
      if (!ctx.file.id.endsWith('.md')) return

      const mermaidBlockRegex = /```mermaid\n([\s\S]*?)```/g
      const matches = [...ctx.file.body.matchAll(mermaidBlockRegex)]
      if (matches.length === 0) return

      const mermaid = (await import('isomorphic-mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        htmlLabels: false,
        theme: 'base',
        securityLevel: 'strict',
        flowchart: {
          htmlLabels: false,
          curve: 'linear',
          wrappingWidth: 300,
          padding: 20,
          nodeSpacing: 30,
          rankSpacing: 60,
          useMaxWidth: true
        },
        themeVariables: {
          background: 'transparent',
          primaryColor: '#dbeafe',
          primaryTextColor: '#1e293b',
          primaryBorderColor: '#93c5fd',
          lineColor: '#94a3b8',
          secondaryColor: '#e2e8f0',
          tertiaryColor: '#f1f5f9',
          fontSize: '20px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif'
        }
      })

      let body = ctx.file.body
      for (const match of matches) {
        try {
          const diagram = match[1]
          if (!diagram) continue
          const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
          const { svg } = await mermaid.render(id, diagram.trim())
          body = body.replace(match[0], `<div class="mermaid-diagram">${svg}</div>`)
        }
        catch (error) {
          console.warn(`[mermaid] Failed to render in ${ctx.file.id}:`, error)
        }
      }
      ctx.file.body = body
    }
  },

  experimental: {
    asyncContext: true
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true,
      autoSubfolderIndex: false
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    provider: 'iconify'
  },

  llms: {
    domain: 'https://commerce.js.org/',
    title: 'CommerceJS',
    description: 'A modular, provider-agnostic eCommerce toolkit for JavaScript and TypeScript.',
    full: {
      title: 'CommerceJS - Full Documentation',
      description: 'Complete documentation for CommerceJS — types, checkout engine, payment providers, and platform adapters.'
    },
    sections: [
      {
        title: 'Getting Started',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/getting-started%' }
        ]
      },
      {
        title: 'Architecture',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/architecture%' }
        ]
      },
      {
        title: 'Packages',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/packages%' }
        ]
      },
      {
        title: 'Guides',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/guides%' }
        ]
      },
      {
        title: 'API Reference',
        contentCollection: 'docs',
        contentFilters: [
          { field: 'path', operator: 'LIKE', value: '/reference%' }
        ]
      }
    ]
  },

  mcp: {
    name: 'CommerceJS Docs',
    route: '/mcp',
    dir: 'mcp'
  }
})