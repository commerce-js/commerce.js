---
"@commercejs/nuxt": patch
---

Fix route handler imports for Cloudflare Workers compatibility

Replace relative imports (`../utils/handler`) with `#imports` across all 74 route files and `handler.ts`. This fixes the "Cannot resolve ../utils/handler and externals are not allowed" build error when Nitro bundles the module for Cloudflare Workers.
