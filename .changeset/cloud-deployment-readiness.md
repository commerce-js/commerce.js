---
"@commercejs/nuxt": minor
"@commercejs/platform": minor
---

Cloud deployment readiness

- **@commercejs/nuxt**: Adapter plugin now detects `DATABASE_URL` for Neon Postgres and calls the correct migration function (`migrateNeon` for Postgres, `migratePrisma` for SQLite). Added admin auth dev-mode bypass, new admin API endpoints for orders and products by ID.
- **@commercejs/platform**: Admin API enhancements — added `getProduct`, `getOrder`, `fulfillOrder`, `refundOrder`, `deleteProduct` methods. Added `seedInitialAdmin` for DB-backed admin users.
