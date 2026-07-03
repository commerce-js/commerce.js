// ---------------------------------------------------------------------------
// Config-guard state — written by the boot plugin, read by /api/_health
// ---------------------------------------------------------------------------
// Lives in utils/ (not the plugin) so a route can import it without pulling
// a Nitro plugin into a request-handler bundle.

export const configGuard = {
  /** False when NUXT_SESSION_PASSWORD is missing/short (dev only — prod aborts boot). */
  sessionSealSecure: true,
}
