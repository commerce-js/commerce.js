// ---------------------------------------------------------------------------
// scripts/check-merchant.ts
// ---------------------------------------------------------------------------
// Diagnostic utility: dumps a merchant row from the control DB. Shows
// identifying fields plus whether `password_hash` and `database_url` are
// populated (without printing either value).
//
// Usage:
//   pnpm exec tsx scripts/check-merchant.ts [subdomain]
//     → defaults to "smoke" if no subdomain given
//
// Read-only. Safe to run in any environment that has NEON_CONTROL_DB_URL.
// ---------------------------------------------------------------------------
/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'

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
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const secrets = loadSecrets(resolve(repoRoot, '.secrets'))
const url = secrets.NEON_CONTROL_DB_URL ?? process.env.NEON_CONTROL_DB_URL
if (!url) {
  console.error('NEON_CONTROL_DB_URL not found in .secrets or env')
  process.exit(1)
}

const sql = neon(url)
const rows = await sql`
  SELECT id, email, name, subdomain, status,
    CASE WHEN password_hash IS NULL THEN 'NULL' ELSE '<set>' END AS pw,
    database_url IS NOT NULL AS has_db
  FROM merchants WHERE subdomain = ${subdomain}
`
console.log(JSON.stringify(rows, null, 2))
