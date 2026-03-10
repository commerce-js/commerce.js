---
"@commercejs/nuxt": patch
---

Remove all explicit imports from handler source files and rely on
Nuxt's server/utils auto-import pattern. Eliminates the need for
template generation and import transformation entirely. Handler files
now have zero imports — all functions (defineCommerceHandler, h3 utils,
data exports) are provided via addServerImportsDir auto-imports.
