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
