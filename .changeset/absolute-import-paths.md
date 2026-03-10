---
"@commercejs/nuxt": patch
---

Rewrite relative imports to absolute paths in generated route templates

Fixes CF Workers deploy by combining template generation (addTemplate),
absolute import path rewriting, and nitro.externals.inline to ensure
all route handler dependencies are properly bundled.
