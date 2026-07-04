// ---------------------------------------------------------------------------
// Public (client-safe) shape of a Merchant control-DB row
// ---------------------------------------------------------------------------
//
// A Merchant row carries two secrets that must never reach the browser:
//   - `passwordHash` — the merchant's login hash.
//   - `databaseUrl`  — a live Postgres connection string WITH credentials.
//
// The operator UI still wants to show the connection string (it was masking
// the password client-side — which meant the raw credential was shipped to the
// browser anyway). `toPublicMerchant` drops `passwordHash` and masks the
// password IN the databaseUrl server-side, so the secret never leaves the box.
// Non-secret operational IDs (neonProjectId, neonBranchId) are kept — the UI
// shows them and they aren't credentials.
// ---------------------------------------------------------------------------

/** Replace the password in a `scheme://user:PASSWORD@host/...` URL with `***`. */
export function maskDatabaseUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // Match the `:password@` between userinfo and host; keep the `:` and `@`.
  return url.replace(/(:)[^@/:]+(@)/, '$1***$2')
}

/**
 * Strip `passwordHash` and mask the credential in `databaseUrl`. Preserves any
 * included relations (domains, apiKeys — which are already selected safely).
 */
export function toPublicMerchant<
  T extends { passwordHash?: unknown, databaseUrl?: string | null },
>(merchant: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _drop, ...rest } = merchant
  return {
    ...rest,
    databaseUrl: maskDatabaseUrl(merchant.databaseUrl),
  } as unknown as Omit<T, 'passwordHash'>
}
