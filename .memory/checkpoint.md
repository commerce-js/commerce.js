# Checkpoint

> Latest detailed checkpoint: [`.memory/checkpoints/2026-07-03T1930.md`](checkpoints/2026-07-03T1930.md)
> Previous checkpoint: [`.memory/checkpoints/2026-04-17T1800.md`](checkpoints/2026-04-17T1800.md)

## Current Phase

**2026-07-03 — security + baseline hardening + M0.5 docs/CI reorg on a branch cut from live `fly/eaas`.** See the latest checkpoint above for the full story. In brief: a handoff describing an "M0" reconciliation was found to be disconnected from this container (that work was never pushed and is unrecoverable here — see checkpoint "Context reconciliation"). Instead, shipped the premise-independent, high-value parts on `claude/commercejs-m0-m05-push-il5lep` (fast-forwarded onto `origin/fly/eaas` `6c10626`): a **fail-closed session seal** (prod refuses to boot without `NUXT_SESSION_PASSWORD` ≥32 — boot-verified both ways), a `@commercejs/core` typecheck fix (restores 37/37), and the M0.5 `.plans`/CLAUDE.md/root-hygiene/CI reorg. All §7 gates green; 301 tests; 1 confirmed security-review finding fixed. **Nothing pushed to `fly/eaas`; open owner decisions listed in the latest checkpoint.**

Earlier context (still valid): T01–T05 merchant-admin + T01–T04 storefront EaaS + hosted-checkout card payments SHIPPED and browser-verified; live on Fly `fra`.

The Fly.io EaaS pipeline (Steps 1–8) provisions merchant Neon branches in
~6 seconds. On top of that, the full four-layer storefront architecture
is now running and browser-verified end-to-end on `smoke.commercejs.cloud`:

- `app.commercejs.cloud` → platform-operator dashboard (T01 API routes at `/api/storefront/*`)
- `smoke.commercejs.cloud` → merchant storefront, SSR'd on a co-supervised `:3001` process, styled with `@nuxt/ui` v4, asset bundles at `/_storefront/*`, populated with 4 sample products + 6 GCC countries
- `nonexistent.commercejs.cloud` → generic shell, no cross-tenant bleed
- `@commercejs/nuxt` composables (`useCart`, `useCheckout`, `useBrands`, `useLocations`) all speak T01's session-based contract; cart badge renders via Nuxt UI v4 `<UChip>`; `/cart` direct-visit works

Branch: `fly/eaas` · Latest commit lands after this session

## What's Blocking "Real Merchant Onboarding"

1. ~~**Credit-card checkout route 404s**~~ ✅ Fixed 2026-04-16 (this session) — `apps/hosted-checkout` now runs as a third co-supervised Fly process on `:3002`. Full card-payment path works end-to-end via Tap.
2. **No merchant admin UI** → merchants have no way to CRUD products / view orders. The existing `apps/dashboard` is platform-operator-facing (manages merchants), not merchant-facing.

## Next Step — Close Out T01

T01 code is **code-complete, reviewed, build green**, but still uncommitted on the working tree. To ship it:

1. **Verify smoke merchant `password_hash` is set on control DB** — the bootstrap path reads `Merchant.passwordHash`; if null, the first login returns a generic 401 that will look like a code bug.

   ```bash
   pnpm exec tsx scripts/verify-merchant-pw.ts
   # expect: "hash present: yes" + ".secrets password matches DB hash: true"
   # if not: pnpm exec tsx scripts/set-merchant-password.ts smoke
   ```

2. **Optional 3-line race fix** in `apps/dashboard/server/api/admin/auth/login.post.ts`: wrap the `admin.auth.createAdmin(...)` call in a try/catch so two simultaneous first-logins don't surface a 500 on the `admin_users.email` UNIQUE constraint collision — fall through to the normal login path on "already exists".

3. **Decide on temp scripts** — `scripts/check-merchant.ts` and `scripts/verify-merchant-pw.ts` are labeled "Temporary" at the top. Either rename/re-document as permanent diagnostic utilities or delete them post-test. `scripts/set-merchant-password.ts` is properly documented — keep.

4. **Deploy + acceptance curl** against `smoke.commercejs.cloud`:
   ```bash
   fly deploy --config fly.toml
   # happy path
   curl -i -X POST https://smoke.commercejs.cloud/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$SMOKE_MERCHANT_EMAIL\",\"password\":\"$SMOKE_MERCHANT_PASSWORD\"}" \
     -c /tmp/cjs-m.txt
   # expect: 200, Set-Cookie: cjs-merchant-session=...; HttpOnly; Secure; SameSite=Lax
   # wrong password
   curl -i -X POST https://smoke.commercejs.cloud/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"'$SMOKE_MERCHANT_EMAIL'","password":"WRONG"}'
   # expect: 401 generic "Invalid email or password"
   # cross-tenant replay (should 403)
   curl -i -b /tmp/cjs-m.txt https://nonexistent.commercejs.cloud/api/admin/auth/session
   # expect: 404 Merchant not found (blocked by tenant middleware before the handler)
   ```

5. **Commit** with the working-tree contents as a single commit. Bump `.plans/merchant-admin/plan.md` T01 status to ✅ and bump `.plans/grand-plan.md` State Snapshot in the same commit (per the update policy added with grand-plan).

6. **Then T02** — admin shell in `apps/storefront` (`.plans/merchant-admin/tasks/T02.md`). Protected layout at `/admin`, redirects unauthed to `/admin/login`, shows a dashboard landing page for authed.

## Review findings (worth knowing before shipping)

Reviewed the T01 working tree 2026-04-17. Code is correct and security-conscious — cross-tenant replay is double-defended, generic 401 hygiene is solid, cookie flags are textbook, first-login bootstrap logic is tight. Build passes; `.output/server/chunks/routes/api/admin/auth/{login,logout,session}` all emitted.

**Filed as follow-ups (not T01 blockers):**
- `packages/platform/src/admin/auth.ts` uses `compareSync` (blocks event loop ~100 ms per login) — swap to async `compare`. ~5-line fix.
- `admin.auth.listAdmins()` used just to check emptiness — expose `countAdmins()` instead. Micro-perf.
- Subdomain enumeration via 404 (unknown merchant) vs 401 (wrong creds) — OWASP-acceptable trade-off for subdomain-based tenancy since subdomains are public-facing by design. Document only.

**Pre-existing carry-over, unchanged:** dashboard tenant middleware still on `bindDb()` + `initPrisma()` fallback. T01 now routes admin traffic through the same race-prone path. Fine for single-merchant smoke; must migrate to `registerEventResolver()` + `useEvent()` before multi-merchant prod traffic. Fix lives in its own commit after merchant-admin ships — see `.memory/checkpoints/2026-04-17T1800.md` "Carry-Overs".

## Where to Look

| Question | File |
|---|---|
| Project orientation + current phase (start here) | `.plans/grand-plan.md` |
| What shipped this session and what's next? | `.memory/checkpoints/2026-04-17T1800.md` |
| Previous session handoff | `.memory/checkpoints/2026-04-16T1000.md` |
| Merchant admin UI plan | `.plans/merchant-admin/plan.md` |
| Storefront EaaS strategy + ranked next-steps | `.plans/storefront-eaas/plan.md` |
| T01–T04 execution + challenges | `.plans/storefront-eaas/tasks/T01.md` – `T04.md` |
| Architectural decisions (locked) | `.memory/decisions.md` |
| Hard-won bugs | `.memory/gotchas.md` |
| Phase 7 roadmap state | `.plans/roadmap.md` |
| Project-wide Claude instructions | `CLAUDE.md` |

## Strategic Context (unchanged)

- **Goal**: EaaS platform (merchant signs up → gets storefront + admin + API + dedicated DB) AND open-source SDK recognition (like Medusa)
- **Why Fly.io**: CF Workers hit hard limits — 50 subrequest cap, WASM-only Prisma, no standard Node.js. Fly.io = standard Node.js, no constraints.
- **OSS story**: The hosted API (T01) + `@commercejs/nuxt` remote mode (T02) means self-hosters get the same shape as EaaS customers — single codebase, two deployment paths.
- **Market**: MENA-first (Bahrain region, Arabic RTL, Tap/stcpay/Mada/Tabby/Tamara).

## Live Deployment

- **App**: `commercejs-cloud` (Fly.io, Frankfurt)
- **Machines**: 2 web (co-supervised dashboard + storefront) + 1 worker + 1 standby worker
- **Image**: latest deployment in `fly deploy` log — check with `fly status --app commercejs-cloud`
- **Health**: `https://commercejs-cloud.fly.dev/api/_health` → 200

## Session-Starting Checklist

1. Read `.plans/grand-plan.md` → orientation: vision, architecture, current phase
2. Read this file → current phase + "Next Step — Close Out T01" above
3. Read `.plans/merchant-admin/tasks/T01.md` → Execution Summary section details what's already implemented
4. `git log --oneline fly/eaas -10` → scan recent work
5. `git status` → expect T01 files on working tree (auth routes, merchant-session/merchant-auth utils, tenant.ts edit, scripts, plan-file updates)
6. Execute the "Next Step — Close Out T01" six-item list above (verify password-hash → optional race fix → temp-script cleanup → deploy → curl-test → single commit bumping plan.md + grand-plan.md)
