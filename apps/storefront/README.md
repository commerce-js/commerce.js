# CommerceJS Storefront

Reference storefront built with Nuxt — a fully functional eCommerce frontend powered by CommerceJS.

## Overview

The storefront is a Nuxt application that demonstrates how to build a complete eCommerce frontend using the CommerceJS ecosystem. It uses `@commercejs/nuxt` for auto-imported composables, `@commercejs/ui` for pre-built commerce components, and connects to a platform adapter for data.

## Features

- **Full product catalog** — Browse, search, and filter products
- **Shopping cart** — Add, update, and remove items with a slide-out cart drawer
- **Checkout flow** — Multi-step checkout with address forms and payment
- **Customer accounts** — Login, registration, order history, saved addresses
- **Wishlist** — Save and manage favorite products
- **Reviews** — View and submit product reviews
- **Responsive design** — Mobile-first layout
- **Dark mode** — Full dark mode support
- **SEO optimized** — Meta tags, structured data, semantic HTML

## Setup

```bash
# From the monorepo root
pnpm install

# Start dev server
cd apps/storefront
pnpm dev
```

## Dependencies

| Package | Role |
|---|---|
| `@commercejs/nuxt` | Nuxt module — composables + auto-generated API |
| `@commercejs/ui` | Pre-built commerce UI components |
| `@commercejs/types` | Shared types |
| `@commercejs/adapter-salla` | Salla platform adapter |

## License

[MIT](../../LICENSE)
