# Gotchas

Hard-won lessons from debugging sessions. Read these before working in related areas.

---

## ~~Neon Serverless v1.x + Drizzle Incompatibility~~ (RESOLVED)
- **Date:** 2026-02-17
- **Resolved:** 2026-02-25 — Drizzle 0.45.1 + Neon 1.0.2 are compatible (46/46 tests pass)
- **Original issue:** `@neondatabase/serverless` v1.x was incompatible with `drizzle-orm@0.38.4`'s `neon-http` driver
- **Fix:** Upgraded `drizzle-orm` to 0.45.1 which supports Neon 1.0's tagged-template API
- **Details:** See checkpoint 2026-02-25T0540

---

## Prisma WASM on Cloudflare Workers
- **Date:** 2026-02-19
- **Symptom:** 500 server error — `WebAssembly.instantiate()` disallowed by embedder
- **Root cause:** `unwasm` (Nitro's WASM plugin) generates `WebAssembly.instantiate()` glue code, which Cloudflare Workers block (dynamic compilation is banned)
- **Fix:** Post-build patching script (`apps/storefront/scripts/patch-wasm.mjs`) replaces glue wrappers with direct `import("file.wasm")` calls that Cloudflare handles natively
- **Key learnings:**
  - `unwasm`'s `order: 'pre'` hooks preempt custom Rollup plugins — you can't hook before it
  - Nitro's `rollupConfig.plugins` don't reliably expose all Rollup hooks
  - Post-build patching is the most reliable approach when you can't control internal plugin behavior
- **Details:** was in `.debug/wasm-cloudflare-fix.md`

---

## Prisma `compilerBuild = "fast"` Corrupts WASM
- **Date:** 2026-02-19
- **Symptom:** `expected magic word 00 61 73 6d, found 0a 69 6d 70` — Cloudflare tries to compile JS as WASM
- **Root cause:** With `compilerBuild = "fast"`, Prisma generates a JS glue file that `unwasm` renames to `.wasm` extension — Cloudflare thinks it's WASM binary and crashes
- **Fix:** Remove `compilerBuild = "fast"` from the Prisma generator config. The `patch-wasm.mjs` also validates WASM magic bytes as defense-in-depth.
- **Details:** was in `.debug/prisma-cloudflare-deployment.md`

---

## Prisma `generate` with Multi-File Schema
- **Date:** 2026-02-19
- **Symptom:** 123 TypeScript errors — `Property 'product' does not exist on type 'PrismaClient'`
- **Root cause:** Running `prisma generate --schema=file.prisma` bypasses `prisma.config.ts` and only reads one file. With multi-file schemas, you must run `prisma generate` without `--schema` flag.
- **Fix:** Use `prisma generate` (no flags) — it reads `prisma.config.ts` which loads all 14 `.prisma` schema files
- **Details:** was in `.debug/prisma-cloudflare-deployment.md`

---

## Vite plugins array undefined in Cloudflare build
- **Date:** 2026-02-19
- **Symptom:** `Cannot read properties of undefined (reading 'push')` during CF build
- **Root cause:** `nuxt.options.vite.plugins` is undefined in Cloudflare's build environment
- **Fix:** Initialize before push: `nuxt.options.vite.plugins = nuxt.options.vite.plugins || []`
- **Details:** was in `.debug/prisma-cloudflare-deployment.md`

---

## Stale cart cookie → 500 on Add to Cart
- **Date:** 2026-02-26
- **Symptom:** "Add to Cart" returns 500 on production (`demo.commercejs.cloud`) — works via curl
- **Root cause:** Browser had `commerce_cart_id` cookie pointing to a cart deleted during a DB migration. `useCart.addItem()` used this stale ID, server threw "Cart not found" → 500
- **Fix:** Made `useCart` auto-recover: `refresh()` clears stale cookies, `addItem()` auto-creates a new cart if none exists + retries on 500/404
- **Key takeaway:** Always handle stale references in cookie-persisted state — DB wipes and migrations invalidate client-side IDs

---

## Neon 423 Locked after project creation
- **Date:** 2026-02-26
- **Symptom:** `createBranch()` returns `423 Locked` immediately after `createProject()`
- **Root cause:** Neon projects take a few seconds to initialize their compute endpoints. During this window, branch operations are locked.
- **Fix:** Retry branch operations with exponential backoff (2s base, 5 retries). The `DeployOrchestrator` should use this pattern when provisioning.
- **Key takeaway:** Neon project creation is async — always add retry logic for operations immediately following it.

---

## Neon getConnectionString response shape
- **Date:** 2026-02-26
- **Symptom:** `getConnectionString()` returns 400 Bad Request
- **Root cause:** The Neon API `/connection_uri` endpoint returns `{ uri: string }`, not `{ connection_uris: [] }`. Also requires `database_name` parameter.
- **Fix:** Updated `NeonProvider.getConnectionString()` to use `response.uri` and pass `database_name: 'neondb'`.
- **Key takeaway:** Always verify API response shapes against real APIs — scaffolded code may have assumed incorrect shapes.

---

## Cloudflare KV namespace creation returns 400, not 409
- **Date:** 2026-02-26
- **Symptom:** `safeCreate` didn't catch KV duplicate errors — deploy failed on second run
- **Root cause:** Cloudflare Pages/R2 return 409 Conflict for duplicate resources, but KV returns 400 Bad Request
- **Fix:** `safeCreate` in `DeployOrchestrator` catches both 400 and 409 as "already exists" signals
- **Key takeaway:** Cloudflare API is inconsistent across products — always catch multiple status codes for idempotent create operations

---

## wrangler binary must be resolved from the cloud package, not the deploy target
- **Date:** 2026-02-26
- **Symptom:** `sh: wrangler: command not found` during `deployWithWrangler`
- **Root cause:** `npx wrangler` doesn't work in pnpm monorepos. wrangler was installed as a devDep of `@commercejs/cloud`, but the resolution logic looked in the storefront's `node_modules` (the deploy target)
- **Fix:** Resolve wrangler binary from the cloud package's own `node_modules/.bin/` using `import.meta.url`, then fall back to project dir, monorepo root, and finally `npx`
- **Key takeaway:** In monorepos, CLI tool resolution must consider where the package is installed, not where the target project lives. Always rebuild after source changes (`pnpm --filter @commercejs/cloud build`).

---

## Nuxt 4 on Cloudflare Pages requires nodejs_compat
- **Date:** 2026-02-26
- **Symptom:** `Deployment failed! No such module "node:buffer"` after successful wrangler upload
- **Root cause:** Nuxt 4 uses Node.js built-in modules (`node:buffer`, `node:process`, etc.) which are not available in Cloudflare Workers without the `nodejs_compat` compatibility flag
- **Fix:** Added `nodejs_compat` to `createPagesProject()` in `CloudflareProvider` so all new Pages projects get it automatically. `--compatibility-flag` is NOT a valid `wrangler pages deploy` CLI option — it must be set on the project via the Cloudflare API.
- **Key takeaway:** Any Node.js app deployed to CF Workers needs `nodejs_compat`. Set it at project creation time, not deploy time.

---

## NuxtHub v0.10+ removed hubDatabase() — use event.context.cloudflare.env.DB
- **Date:** 2026-02-27
- **Symptom:** `hubDatabase is not defined` at runtime, even with `hub.database: true` in config
- **Root cause:** NuxtHub v0.10+ replaced `hubDatabase()` with `db` and `schema` auto-imports from `@nuxthub/db`. The old `hubDatabase()` function no longer exists
- **Fix:** Access D1 directly via `useEvent().context.cloudflare.env.DB` and pass to `drizzle(d1, { schema })`
- **Key takeaway:** When using a custom schema with NuxtHub D1, access the raw D1 binding from the event context. Don't use the old `hubDatabase()` API.

## CF Pages Build: Relative Import Paths
When files are inside `server/api/projects/[id]/`, the path to `server/utils/db` is `../../../utils/db` (3 levels), NOT `../../../../utils/db` (4 levels). The 4th-level path works locally via Node resolution but fails on CF Pages build because Nitro's bundler enforces strict externals. Always count directory levels carefully for server route imports.

## NuxtHub D1: hubDatabase() vs Raw Binding
NuxtHub admin has been sunsetted. To use D1 in production you must:
1. Create a D1 database via CF API: `POST /accounts/{id}/d1/database`
2. Bind it to the CF Pages project via: `PATCH /accounts/{id}/pages/projects/{name}` with `deployment_configs.production.d1_databases.DB`
3. Apply migrations via D1 query API: `POST /accounts/{id}/d1/database/{db_id}/query`
4. Use `hubDatabase()` with fallback to raw `event.context.cloudflare.env.DB` in `useDB()` since `hubDatabase()` may not find the binding if NuxtHub admin isn't managing it.

---

## D1 Schema Drift: Manual Creation vs Drizzle Schema
- **Date:** 2026-02-28
- **Symptom:** `POST /api/projects` returns 500 with no helpful error message
- **Root cause:** The production D1 `projects` table was created manually via CF D1 API with `user_id` column, but Drizzle schema maps `ownerId` → `owner_id`. Also missing `subdomain` column entirely.
- **Fix:** Renamed column via wrangler CLI: `ALTER TABLE projects RENAME COLUMN user_id TO owner_id`, added `ALTER TABLE projects ADD COLUMN subdomain TEXT NOT NULL DEFAULT ''`
- **Key takeaway:** When D1 tables are bootstrapped manually, always verify column names match the Drizzle schema exactly using `PRAGMA table_info(table_name)`. Drizzle won't warn about mismatches — it just generates SQL with wrong column names and D1 returns a generic error.


## CF Pages GitHub Source Connection (2026-02-28)
Cannot connect GitHub source to CF Pages via REST API alone. Requires Cloudflare GitHub App to be installed via the CF Dashboard UI first (Workers & Pages → Create → Connect to Git).

## GitHub Actions Secrets API Encryption (2026-02-28)
GitHub's Actions secrets API requires NaCl sealed box encryption (`crypto_box_seal`), NOT standard AES-GCM or Web Crypto. Use `tweetnacl` library (pure JS, Workers-compatible) with `nacl.box()` and `nacl.hash()` for proper sealed box format.

## GH Actions Lockfile Requirements (2026-02-28)
- `actions/setup-node` with `cache: pnpm` requires `pnpm-lock.yaml` for cache key computation
- `pnpm install --frozen-lockfile` also requires lockfile
- Template-generated repos don't have lockfiles initially
- Use `--no-frozen-lockfile` and don't use `cache: pnpm` for template repos

## Nuxt Module Server Routes on CF Workers (2026-03-02)
- **`addServerScanDir` does NOT work for published npm modules** — auto-imports don't resolve in `node_modules`, and compile-time macros like `defineRouteMeta` aren't stripped from pre-compiled dist files
- **`addServerHandler` with npm dist files also fails** — Nitro can't resolve relative imports (`../utils/handler`) from npm package files when bundling for CF Workers (`externals are not allowed`)
- **The nuxt-modules skill explicitly says**: "Auto-imports don't work in `node_modules`. Runtime files must explicitly import."
- **The correct approach**: Either use package export paths (`@commercejs/nuxt/server`) that Nitro can resolve, use Nitro `addServerTemplate` to generate route code at build time, or ship a single catch-all handler
- **`^0.x.y` semver gotcha**: Caret ranges for 0.x versions only allow patch updates — `^0.5.1` means `>=0.5.1 <0.6.0`, NOT `>=0.5.1 <1.0.0`

