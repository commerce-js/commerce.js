// ---------------------------------------------------------------------------
// Boot config guard — fail closed on missing security config
// ---------------------------------------------------------------------------
//
// The security pillar: a misconfigured production instance must refuse to
// serve rather than silently run insecure. The most dangerous case is a
// missing/short NUXT_SESSION_PASSWORD — the session seal is the only thing
// guarding the operator control plane (merchant CRUD, API-key minting, Neon
// project deletion), so a weak seal means forgeable admin cookies.
//
// Runs first (00. prefix). In production it throws, which aborts boot so Fly
// never routes traffic to an insecure machine. The health endpoint surfaces
// the same signal for operators. In dev it only warns.
// ---------------------------------------------------------------------------

import { sessionPasswordMisconfigured } from '../utils/sessionPassword'
import { configGuard } from '../utils/configGuard'

export default defineNitroPlugin(() => {
  if (sessionPasswordMisconfigured()) {
    configGuard.sessionSealSecure = false
    const message
      = '[config-guard] NUXT_SESSION_PASSWORD is missing or under 32 chars — '
      + 'session cookies cannot be sealed securely.'
    if (!import.meta.dev) {
      // Abort boot: Fly restarts and the machine never serves with a
      // forgeable session seal.
      throw new Error(`${message} Refusing to start in production.`)
    }
    console.warn(`${message} Using the dev fallback (dev only).`)
  }
})
