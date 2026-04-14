import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// ---------------------------------------------------------------------------
// Control DB config — separate from packages/platform's per-merchant DB.
// `NEON_CONTROL_DB_URL` points at the cjs-control Neon project; the
// canonical value lives in the monorepo-root `.secrets` file (gitignored)
// with an optional override in apps/dashboard/.env.
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

// Load shared secrets first, then app-local .env (which can override).
dotenv.config({ path: path.join(repoRoot, '.secrets') })
dotenv.config({ path: path.join(__dirname, '.env'), override: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('NEON_CONTROL_DB_URL'),
  },
})
