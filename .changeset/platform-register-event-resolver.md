---
'@commercejs/platform': minor
---

Add `registerEventResolver()` export — a framework-agnostic way for consumers to teach `getDb()` how to read a per-request Prisma client off `event.context.db`. The resolver takes precedence over the existing `bindDb()` / `initPrisma()` fallback paths, and is the recommended path for multi-tenant runtimes because it's scoped per-event (concurrency-safe under traffic) rather than via module-level state or the fragile `AsyncLocalStorage.enterWith()` pattern that doesn't always propagate across a framework's middleware→handler boundary.

Usage (Nitro example):

```ts
// server/plugins/platform-event-resolver.ts
import { useEvent } from 'nitropack/runtime'
import { registerEventResolver } from '@commercejs/platform'

export default defineNitroPlugin(() => {
  registerEventResolver(() => {
    try { return useEvent() } catch { return null }
  })
})
```

```ts
// server/middleware/tenant.ts
event.context.db = getPrismaClient(merchant.databaseUrl)
```

Requires `nitro.experimental.asyncContext: true` in `nuxt.config.ts` for Nitro consumers.

Backward compatible — existing `bindDb()` + `initPrisma()` fallback paths still work.
