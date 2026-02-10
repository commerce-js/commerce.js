export default defineAppConfig({
  ui: {
    colors: {
      primary: 'azure-radiance',
      neutral: 'slate'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Commerce.js'
  },
  header: {
    title: 'Commerce.js',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/commerce-js/commerce.js',
      'target': '_blank',
      'aria-label': 'GitHub'
    }]
  },
  footer: {
    credits: `Commerce.js • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/commerce-js/commerce.js',
      'target': '_blank',
      'aria-label': 'Commerce.js on GitHub'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/commerce-js/commerce.js/edit/main/packages/docs/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/commerce-js/commerce.js',
        target: '_blank'
      }]
    }
  }
})
