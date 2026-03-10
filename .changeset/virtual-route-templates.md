---
"@commercejs/nuxt": patch
---

Generate route handlers as virtual templates for CF Workers compatibility

Route handlers are now generated as template files in .nuxt/ at build time
instead of pointing to pre-compiled files in node_modules. This resolves
Rollup's inability to resolve relative imports between node_modules files
during Nitro's CF Workers bundling.
