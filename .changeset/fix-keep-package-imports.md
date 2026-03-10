---
"@commercejs/nuxt": patch
---

Fix handler templates to only strip relative imports and keep package
imports (h3, zod). Add h3 import to inlined defineCommerceHandler
replacements since Nitro h3 auto-imports don't apply to addTemplate files.
