---
"@commercejs/nuxt": patch
---

Auto-migrate database on platform adapter startup. Previously, new stores deployed
with the platform adapter would get 500 errors because the Neon database had no
tables. Now `migrateDrizzle()` runs idempotently on first request, creating all
tables via `CREATE TABLE IF NOT EXISTS` before the adapter initializes.
