#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Standalone migration script — run before deploy, not at runtime
// ---------------------------------------------------------------------------
// Usage:
//   DATABASE_URL=... node scripts/migrate.mjs          # migrate only
//   DATABASE_URL=... node scripts/migrate.mjs --seed   # migrate + seed
// ---------------------------------------------------------------------------

import { migrateDrizzle, initDrizzle, getDrizzleDb, seedDrizzle } from '../dist/index.js'

const url = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL
if (!url) {
  // Gracefully skip if no DB URL — don't break the build
  console.log('ℹ️  DATABASE_URL not set — skipping migrations')
  process.exit(0)
}

console.log('🔄 Running migrations...')
initDrizzle(url)
await migrateDrizzle(url)
console.log('✅ Migrations complete')

if (process.argv.includes('--seed')) {
  try {
    await seedDrizzle(getDrizzleDb())
    console.log('✅ Seed complete')
  } catch (err) {
    // 23505 = PostgreSQL unique constraint violation (data already seeded)
    if (err?.code === '23505') {
      console.log('ℹ️  Seed skipped — data already exists')
    } else {
      console.error('❌ Seed failed:', err?.message || err)
      process.exit(1)
    }
  }
}
