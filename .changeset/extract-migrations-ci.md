---
"@commercejs/platform": patch
"@commercejs/nuxt": patch
---

Extract database migrations from runtime cold start to Cloudflare build phase. Add `db:migrate` and `db:migrate:seed` npm scripts. Remove `migrateDrizzle()` from server plugin startup.
