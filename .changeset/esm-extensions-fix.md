---
"@commercejs/nuxt": patch
---

Add .js extensions to relative imports for CF Workers ESM resolution

Post-build script patches compiled .js files to include explicit .js
extensions on relative imports, matching @nuxt/module-builder@1.x
behavior. Required for ESM resolution in Cloudflare Workers.
