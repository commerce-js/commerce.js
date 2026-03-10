---
"@commercejs/nuxt": patch
---

Revert to original relative imports with nitro.externals.inline

Restores the original relative import paths and relies solely on
`nitro.externals.inline` to force Nitro to bundle the module. This
is the correct minimal fix — one config hook in module.ts.
