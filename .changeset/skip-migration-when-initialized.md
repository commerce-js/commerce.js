---
"@commercejs/nuxt": patch
---

Skip migration & seed when DB is already initialized (CF Workers subrequest fix).

Cloudflare Workers enforces a 50 subrequest limit per invocation. Previously,
the adapter plugin always ran migrateDrizzle() (~31 DDL statements) + seedDrizzle()
(~10 INSERTs) on every cold start, exhausting the limit before any actual API
queries could run. Now checks `SELECT 1 FROM store_info LIMIT 1` first (1 subrequest)
and skips migration/seed if the database is already initialized.
