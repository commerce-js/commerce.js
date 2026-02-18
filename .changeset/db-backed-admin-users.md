---
"@commercejs/platform": minor
"@commercejs/nuxt": minor
---

### Admin Auth: DB-backed admin users

- Added `admin_users` table across all 3 database drivers (Prisma, Drizzle, Neon)
- Added `AdminUser` / `AdminUserSafe` types
- New `admin.auth` domain: `login`, `changePassword`, `createAdmin`, `listAdmins`, `deleteAdmin`, `seedInitialAdmin`
- Password hashing with `bcrypt-ts` (matches customer auth)
- Auto-seed initial admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars on first startup
- Login route (`POST /admin/auth/login`) now validates against the database
- New change-password route (`POST /admin/auth/change-password`)
- Session `User` type now includes `id` and `name` fields
