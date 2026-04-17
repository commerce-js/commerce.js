// ---------------------------------------------------------------------------
// scripts/verify-merchant-pw.ts
// ---------------------------------------------------------------------------
// Diagnostic utility: confirms that the password recorded in `.secrets` (or
// the environment) matches the bcrypt `password_hash` stored on the control
// DB for a given merchant. Never prints the password itself — only whether
// emails align and whether the hash compare returns true.
//
// Usage:
//   pnpm exec tsx scripts/verify-merchant-pw.ts [subdomain]
//     → defaults to "smoke"; reads {UPPER_SUBDOMAIN}_MERCHANT_EMAIL and
//       _PASSWORD from .secrets (falling back to the equivalent env vars)
//
// Companion to `set-merchant-password.ts`, which writes the hash. Read-only.
// ---------------------------------------------------------------------------
/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { compare } from 'bcrypt-ts'

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

const subdomain = process.argv[2] ?? 'smoke'
const prefix = subdomain.toUpperCase()

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const secrets = loadSecrets(resolve(repoRoot, '.secrets'))

const controlUrl = secrets.NEON_CONTROL_DB_URL ?? process.env.NEON_CONTROL_DB_URL
const merchantEmail = secrets[`${prefix}_MERCHANT_EMAIL`] ?? process.env[`${prefix}_MERCHANT_EMAIL`]
const merchantPassword = secrets[`${prefix}_MERCHANT_PASSWORD`] ?? process.env[`${prefix}_MERCHANT_PASSWORD`]

if (!controlUrl) {
  console.error('NEON_CONTROL_DB_URL missing')
  process.exit(1)
}
if (!merchantEmail || !merchantPassword) {
  console.error(`${prefix}_MERCHANT_EMAIL or ${prefix}_MERCHANT_PASSWORD missing`)
  process.exit(1)
}

const sql = neon(controlUrl)
const rows = (await sql`
  SELECT email, password_hash FROM merchants WHERE subdomain = ${subdomain}
`) as Array<{ email: string, password_hash: string | null }>

if (rows.length === 0) {
  console.error(`No merchant row for subdomain "${subdomain}"`)
  process.exit(1)
}

const row = rows[0]
console.log(`DB email: ${row.email}`)
console.log(`.secrets email: ${merchantEmail}`)
console.log(`emails match: ${row.email.toLowerCase() === merchantEmail.toLowerCase()}`)
console.log(`hash present: ${row.password_hash ? 'yes' : 'NO'}`)
if (row.password_hash) {
  const match = await compare(merchantPassword, row.password_hash)
  console.log(`.secrets password matches DB hash: ${match}`)
}
