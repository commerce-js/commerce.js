# CommerceJS Documentation

The documentation site for CommerceJS — live at [commerce.js.org](https://commerce.js.org).

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-18181B?logo=nuxt)](https://ui.nuxt.com)

## Overview

Built with [Nuxt Content](https://content.nuxt.com/) and [Nuxt UI](https://ui.nuxt.com), the docs site covers the full CommerceJS ecosystem: getting started guides, architecture overview, package API reference, and integration guides.

## Sections

| Section | Content |
|---|---|
| **Getting Started** | Installation, quick start, first storefront |
| **Architecture** | System overview, adapter pattern, orchestrator, event bus |
| **Packages** | API reference for all `@commercejs/*` packages |
| **Guides** | Multi-adapter composition, hosted checkout, webhook verification |

## Development

```bash
# From the monorepo root
pnpm install

# Start docs dev server
cd apps/docs
pnpm dev
```

The site runs on `http://localhost:3000` with hot reload.

## Deployment

The docs are automatically deployed to [commerce.js.org](https://commerce.js.org) via the `deploy-docs.yml` GitHub Actions workflow on push to `main`.

## License

[MIT](../../LICENSE)
