---
"@commercejs/nuxt": patch
---

Make handler self-contained for Cloudflare Workers compatibility

Inline `useServerAdapter` and `createCommerceContext` directly into `handler.ts` to eliminate all cross-file imports. Route files now import `defineCommerceHandler` via the package exports path (`@commercejs/nuxt/runtime/server/utils/handler`) — a real npm-resolvable path that Nitro can always bundle.

Fixes `defineCommerceHandler is not defined` on CF Workers deploy.
