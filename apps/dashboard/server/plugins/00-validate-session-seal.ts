// ---------------------------------------------------------------------------
// Nitro plugin — refuse to boot with an insecure session seal (production).
// ---------------------------------------------------------------------------
//
// The dashboard seals three cookies (operator, merchant staff, buyer) with
// NUXT_SESSION_PASSWORD. If that secret is missing or < 32 chars in production
// the seal helper falls back to a publicly-known key, which would make every
// session cookie forgeable. `resolveSessionPassword()` already throws per
// request in that case (fail-closed), but a crash on the FIRST auth request is
// a silent, delayed failure. This plugin surfaces it loudly at startup so a
// misconfigured deploy fails fast — the machine never becomes healthy and Fly's
// health check keeps traffic off it.
//
// The `00-` prefix runs it before other plugins. Dev is exempt (the helper
// returns a deterministic fallback there).
// ---------------------------------------------------------------------------

export default defineNitroPlugin(() => {
  if (import.meta.dev) return
  if (!isSessionSealSecure()) {
    throw new Error(
      '[boot] NUXT_SESSION_PASSWORD is missing or shorter than 32 characters — '
      + 'refusing to start. Sealed session cookies (operator, merchant, buyer) '
      + 'require a random secret of at least 32 characters in production.',
    )
  }
})
