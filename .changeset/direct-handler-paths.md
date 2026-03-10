---
"@commercejs/nuxt": patch
---

Fix CF Workers ReferenceError by using direct handler file paths
instead of generating template files in .nuxt/.

Template-based approach caused Rollup to create duplicate module
identities, leading to $1 suffix renames. Direct file paths with
nitro.externals.inline let Rollup process handlers through its
normal module graph without identity conflicts.
