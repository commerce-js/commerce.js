// ---------------------------------------------------------------------------
// API key format — single source of truth for mint + resolve
// ---------------------------------------------------------------------------
//
// Keys are `<prefix>_<secret>`:
//   - prefix: `cjs` + 10 hex chars, contains NO underscore, stored in cleartext
//     (uniquely identifies the row; safe to show in the UI)
//   - secret: 48 hex chars, never stored
// Only sha256(fullKey) is persisted. The tenant resolver looks up by prefix
// (extractKeyPrefix) then verifies by hash (hashApiKey) — mint and resolve
// MUST agree, hence this shared module.
// ---------------------------------------------------------------------------

import { createHash, randomBytes } from 'node:crypto'

export interface GeneratedApiKey {
  /** Full secret — shown to the operator exactly once, never stored. */
  plaintext: string
  /** Cleartext lookup handle stored on the row. */
  keyPrefix: string
  /** sha256(plaintext) stored on the row. */
  keyHash: string
}

/** sha256 hex of the full key. */
export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex')
}

/** The prefix is everything before the first `_`. */
export function extractKeyPrefix(fullKey: string): string | null {
  const prefix = fullKey.split('_')[0]
  return prefix || null
}

/** Mint a new key. */
export function generateApiKey(): GeneratedApiKey {
  const keyPrefix = `cjs${randomBytes(5).toString('hex')}` // cjs + 10 hex, no `_`
  const plaintext = `${keyPrefix}_${randomBytes(24).toString('hex')}`
  return { plaintext, keyPrefix, keyHash: hashApiKey(plaintext) }
}
