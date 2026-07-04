// ---------------------------------------------------------------------------
// GET /api/_health — Fly.io health probe (see fly.toml http_service.checks)
// ---------------------------------------------------------------------------
//
// Stays cheap on purpose: doesn't touch the control DB or Redis. Fly polls
// it every 30 s with a 5 s timeout, and a slow check kills traffic on a
// machine that's actually fine. If we ever want a deep readiness probe,
// add it as a separate path (e.g. /api/_ready) so liveness vs readiness
// stay independent.
// ---------------------------------------------------------------------------

import { defineEventHandler } from 'h3'

export default defineEventHandler(() => ({
  ok: true,
  service: 'commercejs-cloud',
  // Confirms a >= 32-char NUXT_SESSION_PASSWORD is configured. In production
  // the app refuses to boot when this would be false (see
  // server/plugins/00-validate-session-seal.ts), so a served response always
  // reports true there; exposed for smoke tests and local visibility.
  sessionSealSecure: isSessionSealSecure(),
  ts: Date.now(),
}))
