---
"@commercejs/nuxt": patch
---

Fix CF Workers deployment by inlining defineCommerceHandler logic into
generated route templates, eliminating ALL external imports.

Templates are necessary (Rollup can't resolve relative imports in
node_modules), but previous template approaches created duplicate module
identities causing $1 renames. The inlined approach uses only Nitro
auto-imports, breaking the dependency chain entirely.
