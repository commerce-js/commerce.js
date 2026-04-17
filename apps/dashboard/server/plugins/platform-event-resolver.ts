// ---------------------------------------------------------------------------
// Nitro plugin — register Nitro's useEvent() with @commercejs/platform
// ---------------------------------------------------------------------------
// Teaches the platform package how to look up the current request's event,
// so its `getDb()` can read a per-request Prisma client off `event.context.db`.
// This is the scalable path (concurrency-safe per-event scoping) and
// supersedes the racy initPrisma + AsyncLocalStorage fallback.
//
// Runs once at Nitro startup. `useEvent()` itself uses Nitro's own ALS,
// which is set up by Nitro's entry adapter BEFORE middleware/handler
// dispatch — so it propagates correctly across the middleware→handler
// boundary where `AsyncLocalStorage.enterWith()` from userland middleware
// doesn't.
//
// Mirrors apps/hosted-checkout/server/plugins/platform-event-resolver.ts.
// ---------------------------------------------------------------------------

import { registerEventResolver } from '@commercejs/platform'
import { useEvent } from 'nitropack/runtime'

export default defineNitroPlugin(() => {
  registerEventResolver(() => {
    try {
      return useEvent()
    }
    catch {
      // Outside request context (e.g. worker spawned from Nitro plugin) —
      // let platform fall through to ALS / singleton resolution.
      return null
    }
  })
})
