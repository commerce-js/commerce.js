import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Control DB config — separate from packages/platform's per-merchant DB.
// CONTROL_DATABASE_URL points at the cjs-control Neon project.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('CONTROL_DATABASE_URL'),
  },
})
