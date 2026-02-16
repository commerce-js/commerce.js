---
"@commercejs/platform": minor
---

Add Neon Postgres driver and async adapter auto-detection

- Neon driver: `initPrismaNeon()` using `@neondatabase/serverless` + `@prisma/adapter-neon`
- `createPlatformAdapter()` is now async with automatic driver detection from `DATABASE_URL`
- New config options: `driver` (`'sqlite'` | `'neon'`) and `connectionString`
