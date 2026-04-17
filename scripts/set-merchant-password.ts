// ---------------------------------------------------------------------------
// scripts/set-merchant-password.ts
// ---------------------------------------------------------------------------
// Sets a merchant's password_hash in the control DB via bcrypt.
// One-off operational utility for dev/staging merchants whose control-DB
// password drifted from `.secrets`.
//
// Usage:
//   pnpm exec tsx scripts/set-merchant-password.ts <subdomain>
//     → reads {UPPER_SUBDOMAIN}_MERCHANT_EMAIL + _PASSWORD from .secrets
//   pnpm exec tsx scripts/set-merchant-password.ts <subdomain> <email> <password>
//     → uses the provided values directly
//
// Verifies `email` matches the existing merchant.email before writing.
// Idempotent: safe to re-run.
// ---------------------------------------------------------------------------
/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { hash } from 'bcrypt-ts'

function loadSecrets(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const text = readFileSync(path, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i)
      if (!m) continue
      let v = m[2]
      // Match bash semantics: quoted value ends at the matching closing
      // quote; anything after (comments, whitespace) is ignored. Unquoted
      // values end at the first unescaped `#` or EOL.
      const q = v[0]
      if (q === '"' || q === '\'') {
        const end = v.indexOf(q, 1)
        if (end === -1) continue
        v = v.slice(1, end)
      }
      else {
        const hash = v.indexOf('#')
        if (hash !== -1) v = v.slice(0, hash)
        v = v.trim()
      }
      out[m[1]] = v
    }
  } catch { /* ignore */ }
  return out
}

const subdomain = process.argv[2]
if (!subdomain) {
  console.error('Usage: pnpm exec tsx scripts/set-merchant-password.ts <subdomain> [email] [password]')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const secrets = loadSecrets(resolve(repoRoot, '.secrets'))

const controlUrl = secrets.NEON_CONTROL_DB_URL ?? process.env.NEON_CONTROL_DB_URL
if (!controlUrl) {
  console.error('NEON_CONTROL_DB_URL missing — expected in .secrets or env')
  process.exit(1)
}

// Default to convention-based secret lookup: SMOKE → SMOKE_MERCHANT_EMAIL etc.
const prefix = subdomain.toUpperCase()
const email = process.argv[3]
  ?? secrets[`${prefix}_MERCHANT_EMAIL`]
  ?? process.env[`${prefix}_MERCHANT_EMAIL`]
const password = process.argv[4]
  ?? secrets[`${prefix}_MERCHANT_PASSWORD`]
  ?? process.env[`${prefix}_MERCHANT_PASSWORD`]

if (!email || !password) {
  console.error(
    `Missing credentials. Expected either CLI args (<subdomain> <email> <password>) `
    + `or ${prefix}_MERCHANT_EMAIL / ${prefix}_MERCHANT_PASSWORD in .secrets.`,
  )
  process.exit(1)
}

const sql = neon(controlUrl)

// 1. Find the merchant and verify email matches.
const rows = (await sql`
  SELECT id, email, name, status FROM merchants WHERE subdomain = ${subdomain}
`) as Array<{ id: string, email: string, name: string, status: string }>

if (rows.length === 0) {
  console.error(`No merchant with subdomain "${subdomain}"`)
  process.exit(1)
}

const merchant = rows[0]
if (merchant.email.toLowerCase() !== email.toLowerCase()) {
  console.error(
    `Email mismatch: DB has "${merchant.email}", you provided "${email}". `
    + `Refusing to change email via password reset — use a separate UPDATE if that's intended.`,
  )
  process.exit(1)
}

// 2. Hash + write.
console.log(`[set-pw] merchant: ${merchant.name} (${merchant.id}), email=${merchant.email}, status=${merchant.status}`)
console.log('[set-pw] hashing with bcrypt…')
const passwordHash = await hash(password, 10)

console.log('[set-pw] writing to control DB…')
await sql`
  UPDATE merchants SET password_hash = ${passwordHash}, updated_at = NOW()
  WHERE id = ${merchant.id}
`
console.log('[set-pw] ✓ done')
