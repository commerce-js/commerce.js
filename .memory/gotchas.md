# Gotchas

Hard-won lessons from debugging sessions. Read these before working in related areas.

---

## Neon Serverless v1.x + Drizzle Incompatibility
- **Date:** 2026-02-17
- **Symptom:** `sql must be called as tagged template, not function` runtime error
- **Root cause:** `@neondatabase/serverless` v1.x dropped the function-call API that `drizzle-orm@0.38.4`'s `neon-http` driver uses internally
- **Fix:** Pin `@neondatabase/serverless` to `^0.10.4` (v0.x)
- **Revisit when:** `drizzle-orm` releases a version compatible with `@neondatabase/serverless` v1.x
- **Details:** was in `.debug/neon-v1-drizzle-compat.md`

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
