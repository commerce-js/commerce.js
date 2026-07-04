// ---------------------------------------------------------------------------
// API key format — shared by BOTH the mint route and the tenant resolver
// ---------------------------------------------------------------------------
//
// A merchant API key (sent as the `X-Commerce-Key` header) has the shape:
//
//     <prefix>_<secret>
//
//   - `prefix` is `cjs` + random hex. It is stored in the clear on the ApiKey
//     row (`keyPrefix`) and indexed, so a lookup is a selective query rather
//     than a full-table hash scan. It contains NO underscore, so the split
//     below is unambiguous.
//   - `secret` is random hex. Only the SHA-256 of the FULL key is stored
//     (`keyHash`) — the plaintext secret is shown to the operator exactly once
//     at mint time and is never recoverable.
//
// Keeping generation + parsing + hashing in one module means the mint route
// and `utils/tenant.ts`'s resolver can never drift out of sync on the format.
// ---------------------------------------------------------------------------

import { createHash, randomBytes } from 'node:crypto'

/** SHA-256 (hex) of the full key — stored as `ApiKey.keyHash`, matched on lookup. */
export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex')
}

/**
 * The indexed lookup prefix for a full key: everything before the first `_`.
 * Returns null for a malformed key (no prefix segment). The resolver uses this
 * to narrow the `keyPrefix` query before hash-verifying.
 */
export function apiKeyLookupPrefix(fullKey: string): string | null {
  const prefix = fullKey.split('_', 1)[0]
  return prefix ? prefix : null
}

export interface GeneratedApiKey {
  /** Full `<prefix>_<secret>` — return to the operator ONCE, never persisted. */
  fullKey: string
  /** Stored in the clear + indexed (`ApiKey.keyPrefix`). */
  keyPrefix: string
  /** SHA-256 of `fullKey` (`ApiKey.keyHash`). */
  keyHash: string
}

/** Mint a fresh API key. Hex alphabet only, so the `_` separator stays unambiguous. */
export function generateApiKey(): GeneratedApiKey {
  const keyPrefix = `cjs${randomBytes(6).toString('hex')}` // 'cjs' + 12 hex chars, no '_'
  const secret = randomBytes(24).toString('hex') // 48 hex chars
  const fullKey = `${keyPrefix}_${secret}`
  return { fullKey, keyPrefix, keyHash: hashApiKey(fullKey) }
}
