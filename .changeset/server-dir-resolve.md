---
"@commercejs/nuxt": patch
---

Fix defineCommerceHandler runtime error on Cloudflare Pages by using
package export paths (@commercejs/nuxt/runtime/server/...) instead of
absolute filesystem paths in generated route handler templates.

The absolute paths caused Rollup to treat the import as a different
module identity from the package's own internal exports, renaming
defineCommerceHandler to defineCommerceHandler$1 and causing an
Uncaught ReferenceError at Worker runtime.
