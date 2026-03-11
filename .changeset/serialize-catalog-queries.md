---
"@commercejs/platform": patch
---

Serialize catalog queries for Cloudflare Workers compatibility.

The Drizzle ORM neon-http driver fails on parallel queries (Promise.all) on
Cloudflare Workers with "Failed query" errors. Switched to sequential queries
in fetchProductRelations, getProducts, and findProducts.
