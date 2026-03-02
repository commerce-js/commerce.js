---
"@commercejs/nuxt": patch
---

Fix `defineNitroPlugin is not defined` error when deploying to Cloudflare Pages.
Added explicit import from `nitropack/runtime` since Nitro auto-imports don't work for published packages at runtime.
