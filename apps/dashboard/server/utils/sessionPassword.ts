// ---------------------------------------------------------------------------
// Session sealing key — resolve once, fail closed in production
// ---------------------------------------------------------------------------
//
// All three session cookies (dashboard operator, merchant staff, buyer) are
// sealed with NUXT_SESSION_PASSWORD. This secret is the ONLY thing standing
// between the internet and an admin cookie — the tenant middleware skip-lists
// the control-plane routes, so a forgeable seal means forgeable merchant CRUD
// and Neon-project deletion.
//
// Therefore: in production a missing/short secret refuses to serve. The
// deterministic dev fallback exists ONLY under `import.meta.dev` so cookies
// survive local restarts. See /api/_health for the config-guard signal.
// ---------------------------------------------------------------------------

const DEV_FALLBACK = 'dev-only-session-key-32-chars-min!'
const MIN_LENGTH = 32

/** True when the sealing key is unusable for a production deploy. */
export function sessionPasswordMisconfigured(): boolean {
  const pw = process.env.NUXT_SESSION_PASSWORD
  return !pw || pw.length < MIN_LENGTH
}

/**
 * Resolve the cookie-sealing password. Throws in production when the secret
 * is missing or under 32 chars; returns a deterministic dev key otherwise.
 */
export function resolveSessionPassword(): string {
  const configured = (() => {
    try {
      // useRuntimeConfig is auto-imported in Nitro; guard for non-Nitro callers.
      return (useRuntimeConfig() as { sessionPassword?: string }).sessionPassword
    }
    catch {
      return undefined
    }
  })()

  const pw = configured || process.env.NUXT_SESSION_PASSWORD
  if (pw && pw.length >= MIN_LENGTH) return pw

  if (!import.meta.dev) {
    throw new Error(
      'NUXT_SESSION_PASSWORD is missing or under 32 chars. Refusing to seal '
      + 'sessions with the insecure dev fallback in production. Set it in the '
      + 'Fly.io app secrets (or the monorepo-root .secrets file locally).',
    )
  }
  return DEV_FALLBACK
}
