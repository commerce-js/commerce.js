# Gotchas

## Cloudflare Workers — 50 Subrequest Limit
CF Workers has a hard limit of 50 subrequest calls per request. The platform adapter was making 7+ SQL queries per request, and multiple API calls from SSR would compound this. Fixed by using local route overrides in `.tmp-storex/server/api/_commerce/` that don't go through the subrequest path.

## Nitro `addServerScanDir` — Silent Auto-Import Failure
When a Nuxt module uses `addServerScanDir` to register server routes, the auto-imports for those routes may fail silently on Cloudflare Workers. The routes exist but their handlers can't resolve imported utilities. Workaround: create local route files in the consuming app's `server/` directory that explicitly import what they need.

## Nuxt Auto-Imports Don't Apply to node_modules on CF Workers SSR
**CRITICAL**: Vue SFC components and config files shipped via `node_modules` do NOT receive Nuxt's auto-import transform (computed, ref, watch, useAppConfig, useRuntimeConfig, etc.) during SSR on Cloudflare Workers. Even `build.transpile` and `nitro.externals.inline` don't fix this — the auto-import plugin path exclusion is at the Vite/unplugin level.

**Fix**: Add explicit imports to all components:
- `import { computed, ref, watch, ... } from 'vue'`
- `import { useAppConfig, useRuntimeConfig } from '#imports'`

This affected `@commercejs/ui` (33 components) and `@commercejs/nuxt` (3 composables). Also affected:
- `defineAppConfig()` in `app.config.ts` — use raw object export instead
- Layout/error files in the consuming app may also need explicit imports

## nuxt-auth-utils — NUXT_SESSION_PASSWORD Required in Production
The `nuxt-auth-utils` module requires `NUXT_SESSION_PASSWORD` environment variable to be set in production for session cookie encryption. In dev mode, it auto-generates one. Without it, SSR crashes with `Error: Empty password` when any page triggers the auth session middleware.

## Nuxt in-process `$fetch` Drops Headers AND `event.context` (T04)
During SSR, `useFetch('/api/...')` with a relative URL dispatches the local handler in-process (no HTTP round-trip). Two surprises:
- `event.context` from the outer SSR request does NOT flow to the inner handler's event. Even though h3's `fetchWithEvent` sets `context: init?.context || event.context` on the outgoing fetch options, that context doesn't become `event.context` on the new handler's event.
- The outer request's headers don't reliably flow either. Inner event sees `Host: localhost`, no `x-forwarded-host`.

**Fix**: Use Node's `AsyncLocalStorage` to carry per-request state across the boundary. Enter a store frame on every incoming request via a Nitro `request` hook; the inner handler reads from `store.getStore()`. See `packages/nuxt/src/runtime/server/plugins/proxy-forwarded-host.ts` for the pattern.

## Nitro Public-Asset Handler Runs Before User Middleware (T04)
Paths registered by Nuxt's build for `app.buildAssetsDir` (default `/_nuxt/`) are served by a handler registered at build time that matches those URL prefixes and 404s if the file isn't in `.output/public/`. User middleware in `server/middleware/` does NOT intercept these paths first. Impact: if the dashboard and storefront are co-deployed on the same origin and both emit `/_nuxt/*`, each 404s the other's bundles.

**Fix**: Give each app a distinct `app.buildAssetsDir`. Storefront now uses `/_storefront/`.

## `wait -n` Is Bash-Only, Not dash
`node:22-slim`'s `/bin/sh` is dash, which doesn't implement `wait -n` (wait for any child). Caused `scripts/start-web.sh` to die with "Illegal option -n" immediately on boot → crash loop.

**Fix**: Use `#!/bin/bash` explicitly (bash is present on node:22-slim) and invoke as `/bin/bash scripts/start-web.sh` in `fly.toml`.

## Prisma 7 Strict Env Resolution at `prisma generate` (T04)
`prisma.config.ts` calls `env('DATABASE_URL')` which now hard-errors at config-load time if the env var isn't set, even though `prisma generate` itself doesn't touch a DB. The dashboard step already had a `NEON_CONTROL_DB_URL="postgresql://placeholder..."` workaround; the platform's `prisma generate` needed its own `DATABASE_URL` placeholder.

**Fix**: Always pass a placeholder URL env var at `prisma generate` time in the Dockerfile.

## `nuxt build` Doesn't See Fly `[env]` Runtime Vars (T04)
Env vars set in `fly.toml [env]` are runtime-only. `nuxt build` runs at Docker build time and sees only what's `ENV`'d in the Dockerfile (or build args). Consequence for mode switches: if module detection keys off `process.env.FOO` at build time, the Fly-scoped FOO won't be visible and the module's build-time branches will take the wrong path.

**Fix**: Expose mode switches as options in `nuxt.config.ts`, not env vars. The env var can override them at runtime but doesn't own the decision. Example: `@commercejs/nuxt`'s remote mode keys off `commerce.apiRoutes: false`, not `NUXT_COMMERCE_REMOTE_API_BASE`.

## Nitro SWR Has No Vary-by-Host (T04)
`routeRules['/']={swr: 3600}` caches rendered HTML by URL path only. In a multi-tenant deploy where every subdomain hits the same `/` path, the first merchant's SSR'd page is served to every other merchant's subdomain for the entire TTL. `curl nonexistent.commercejs.cloud/` returning merchant A's content is the telltale sign.

**Fix** (interim): disable page-level SWR. Per-tenant cache keys are future work — would require a custom cache handler that includes `x-forwarded-host` in the key.

## `useRuntimeConfig()` Is Frozen at Nitro Runtime (T03)
Setting `runtime.public.store = { … }` from inside a Nitro `request` hook throws `Cannot assign to read only property 'store' of object`. Public runtime config is sealed after Nitro boot.

**Fix**: For per-request data, use `event.context` or AsyncLocalStorage. For merchant-shared data that needs to flow to the client, fetch via `useFetch` with a key (cached per SSR pass) rather than trying to mutate runtime config.

## Declaring `@prisma/client` on `@commercejs/platform` Breaks the Docker Build
The platform package's generated Prisma client (`src/database/prisma/generated/internal/class.js`) imports `@prisma/client/runtime/client`, but `packages/platform/package.json` does NOT declare `@prisma/client` as a dep. Consumers like `apps/dashboard` declare it themselves and bundle at build time, so the miss never surfaces there.

Declaring it on platform feels like the "correct" fix, but it causes two regressions:
1. `packages/platform/src/database/prisma/queries/profiles.ts` type-checks against stricter Prisma 7.7 generated types. `Record<string, any> | null` in the function signatures (e.g. `preferences`, `billingAddress`) fails to assign to the new `NullableJsonNullValueInput | InputJsonValue` input shape — `null` must become `Prisma.DbNull` or be omitted.
2. Previously-dormant TSC-resolution paths flip to strict: without a resolvable `@prisma/client` anywhere in the workspace-root walk from `packages/platform/`, TSC was silently typing the generated imports loosely; the declared dep creates a symlink at `packages/platform/node_modules/@prisma/client` that forces strict resolution.

**Fix**: Do NOT declare `@prisma/client` on platform until `profiles.ts` is properly reworked to use `Prisma.DbNull` sentinels. For unbundled consumers (seed scripts, CLI tools), declare `@prisma/client` on the consumer workspace package instead — pnpm will symlink it into the consumer's `node_modules` where Node's upward walk can find it when loading platform/dist code.

See `scripts/package.json` for the working pattern.

## Nuxt UI v4 Dropped UButton's `:badge` Prop (Silent Drop)
Nuxt UI v3 supported `<UButton :badge="…" :badge-color="…">` for overlaid count indicators. In v4 (4.4.0 at time of writing) those props were removed without replacement or console warning — they're silently ignored. The badge never renders; no error.

**Fix**: Wrap the button in `<UChip :text="…" :show="…" color="primary">`. UChip v4 has `inset`, `position`, and `standalone` props for fine-tuning placement.

## Nitro `AsyncLocalStorage.enterWith()` Doesn't Propagate Middleware→Handler
`AsyncLocalStorage.enterWith(store)` sets the store for the *current* async resource. When Nitro awaits a middleware's returned promise, it resumes in its own async context — the store is attached to the middleware's async frame, not the dispatcher's continuation. By the time the handler runs, `getStore()` returns `undefined`.

This means `bindDb(client)` called from a Nitro middleware does NOT reliably make `getDb()` work in the subsequent handler. The dashboard's `tenant.ts` middleware looked like it worked only because `createPlatformAdapter()` internally also calls `initPrisma()`, which sets the module-level `_db` singleton — and `getDb()` falls back to `_db`. That fallback is **racy under concurrent different-merchant traffic** (last caller wins).

**Fix**: Use the framework-native per-event context instead. `@commercejs/platform` exports `registerEventResolver((): EventLike => event)`. Consumers (Nitro apps) register once in a plugin, then the middleware sets `event.context.db = getPrismaClient(url)`. `getDb()` reads from there via the resolver. Scalable, concurrency-safe, framework-agnostic.

For Nitro specifically: requires `nitro.experimental.asyncContext: true` in `nuxt.config.ts`, because `useEvent()` is gated behind that flag (it throws "Enable the experimental flag using `experimental.asyncContext: true`" otherwise — caught silently by the resolver's try/catch unless you check logs).

The pattern lives in `apps/hosted-checkout/server/plugins/platform-event-resolver.ts`. Dashboard still uses the legacy bindDb+initPrisma path; migrate next time the file is touched.

## `useEvent()` from `nitropack/runtime` Requires `experimental.asyncContext: true`
Silent failure: `useEvent()` throws a readable error, but if you try/catch it (as is normal for "am I in request context?" probing) the error message gets swallowed. The try/catch is necessary for non-Nitro consumers but hides the root cause. Check Fly / console logs if `event.context.db` resolution never works.

**Fix**: Always enable `nitro.experimental.asyncContext: true` in `nuxt.config.ts` when any code path relies on `useEvent()` for cross-boundary event lookup. Nitro 2.13+ — the flag has been stable for a while but isn't default.

## `NUXT_PUBLIC_*` Is The ONLY Way to Inject Public Runtime Config at Fly Runtime
`runtimeConfig.public.<key>` defaults like `process.env.FOO || ''` are evaluated at `nuxt build` time — inside Docker, where Fly secrets aren't available. The default gets baked as empty string.

At runtime, Nuxt only re-reads env vars matching the `NUXT_PUBLIC_<UPPER_SNAKE_PATH>` convention. So to override `runtimeConfig.public.googleMapsKey` you need `NUXT_PUBLIC_GOOGLE_MAPS_KEY`, not `GOOGLE_MAPS_KEY`. Same for `runtimeConfig.public.tapPublicKey` → `NUXT_PUBLIC_TAP_PUBLIC_KEY`.

This bit twice — Google Maps first session, Tap public key the session after. The pattern is: **whenever you add any `runtimeConfig.public.*` key that comes from an env, the matching Fly secret MUST be `NUXT_PUBLIC_<UPPER_SNAKE_CASE>`**. Unprefixed names only work in local dev where the build and runtime share the same env.

Server-side runtime config (top-level `runtimeConfig.*`, not `.public.*`) uses `NUXT_<UPPER_SNAKE>` and has the same rule. Plain env names like `TAP_SECRET_KEY` are fine for direct `process.env.*` reads but do NOT map into `useRuntimeConfig()`.

**Fix**: `fly secrets set NUXT_PUBLIC_<KEY>=value --app …`. Use `--stage` if you're about to deploy new code so the restart is bundled. Verify by curling a page and grepping the rendered HTML for `"<camelCaseKey>":"<value>"` in the injected `window.__NUXT__` config.
