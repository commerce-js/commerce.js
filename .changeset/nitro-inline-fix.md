---
"@commercejs/nuxt": patch
---

Force Nitro to inline @commercejs/nuxt runtime for CF Workers

Add nitro:config hook that pushes @commercejs/nuxt to
nitro.externals.inline. Without this, Nitro externalizes
node_modules by default, causing `defineCommerceHandler is not
defined` on Cloudflare Workers and other edge runtimes.
