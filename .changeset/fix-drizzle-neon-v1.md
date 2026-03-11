---
"@commercejs/platform": patch
---

Fix Drizzle + @neondatabase/serverless v1.x compatibility on Cloudflare Workers.

The `drizzle(connectionString)` shorthand internally uses a `client.query ?? client`
fallback that is incompatible with @neondatabase/serverless v1.x, causing parallel
queries (via Promise.all) to fail with "Failed query" errors. Fixed by explicitly
creating the `neon()` HTTP client and passing it to `drizzle({ client, schema })`.
