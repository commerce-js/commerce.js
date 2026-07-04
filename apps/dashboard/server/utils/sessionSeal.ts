// ---------------------------------------------------------------------------
// Session-seal secret resolution — FAIL CLOSED in production.
// ---------------------------------------------------------------------------
//
// All three sealed cookies — dashboard operator (`session.ts`), merchant staff
// (`merchant-session.ts`), and buyer (`buyerSession.ts`) — are keyed by
// NUXT_SESSION_PASSWORD. h3's `useSession` requires a >= 32-char password.
//
// Historically each util fell back to a hardcoded dev key when the env var was
// missing or too short. That fallback fired in PRODUCTION too, so a prod deploy
// without the secret would seal every session with a publicly-known key —
// meaning anyone could forge operator and merchant cookies. This helper makes
// that impossible: in production a weak/absent secret throws.
//
// The decision lives in ONE pure function (`pickSessionPassword`) so the policy
// can't drift between the three call sites, and so it's unit-testable without a
// Nuxt runtime. The Nuxt-aware wrappers below just feed it the resolved secret
// and `import.meta.dev`.
// ---------------------------------------------------------------------------

/** h3's `useSession` requires at least this many characters. */
export const MIN_SESSION_PASSWORD_LENGTH = 32

/**
 * Dev-only deterministic key so sealed cookies survive server restarts during
 * local development. NEVER reachable in production — `pickSessionPassword`
 * throws instead of returning this when `isDev` is false.
 */
export const DEV_SESSION_FALLBACK = 'dev-only-session-key-32-chars-min!'

/** True when `secret` is a production-grade seal password (>= 32 chars). */
export function isSecureSecret(secret: string | undefined | null): boolean {
  return typeof secret === 'string' && secret.length >= MIN_SESSION_PASSWORD_LENGTH
}

/**
 * Pure seal-password policy — no Nuxt/runtime dependencies.
 *
 * - A secret of >= 32 chars is always used.
 * - Otherwise, in development the deterministic dev fallback is returned.
 * - Otherwise (production, weak/absent secret) it THROWS — the app must refuse
 *   to seal sessions with an insecure key.
 */
export function pickSessionPassword(secret: string | undefined | null, isDev: boolean): string {
  if (isSecureSecret(secret)) return secret as string
  if (isDev) return DEV_SESSION_FALLBACK
  throw new Error(
    'NUXT_SESSION_PASSWORD is missing or shorter than 32 characters. '
    + 'Refusing to seal sessions with an insecure key in production. '
    + 'Set NUXT_SESSION_PASSWORD to a random string of at least 32 characters.',
  )
}

/** Read the configured secret from runtime config, falling back to the env var. */
function rawSecret(): string | undefined {
  const configured = useRuntimeConfig().sessionPassword as string | undefined
  return configured || process.env.NUXT_SESSION_PASSWORD
}

/**
 * Resolve the seal password for the current server context. Fail CLOSED in
 * production (throws), dev fallback only in development. Used by all three
 * session utils so the format can't drift.
 */
export function resolveSessionPassword(): string {
  return pickSessionPassword(rawSecret(), import.meta.dev)
}

/** True when a production-grade NUXT_SESSION_PASSWORD is configured. */
export function isSessionSealSecure(): boolean {
  return isSecureSecret(rawSecret())
}
