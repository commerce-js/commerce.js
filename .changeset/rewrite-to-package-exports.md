---
"@commercejs/nuxt": patch
---

Rewrite relative imports in handler templates to @commercejs/nuxt
package export paths. Uses tail-matching to extract the meaningful
import suffix (e.g. utils/handler from ../../utils/handler.js) and
prefix it with the package export base. This ensures Rollup can
resolve all imports regardless of file location.
