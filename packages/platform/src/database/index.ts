// ---------------------------------------------------------------------------
// Database barrel export
// ---------------------------------------------------------------------------
// Active driver on the fly/eaas branch: **Prisma** (standard Node.js, full
// support for transactions / connection pools via @prisma/adapter-neon).
// Drizzle is kept in-tree for the `main` branch (Cloudflare Workers, where
// neon-http is used). Both drivers share the same query barrel shape — swap
// the re-export below and domain code doesn't change.

// Prisma (active)
export { initPrisma, getDb, getDb as getPrismaDb, resetDb, bindDb, runWithDb } from './prisma/client.js'
export type { PrismaDatabase } from './prisma/client.js'
export { getPrismaClient, disconnectPrismaClient, disconnectAll } from './prisma/client.js'

// Drizzle (dormant on fly/eaas — active on main)
// export { initDrizzle, getDb as getDrizzleDb } from './drizzle/client.js'
// export { getDb } from './drizzle/client.js'
// export type { DrizzleDatabase } from './drizzle/client.js'
// export { migrateDrizzle } from './drizzle/migrate.js'
// export { seedDrizzle } from './drizzle/seed.js'

// Queries (active driver — swap this line to switch drivers)
export * from './prisma/queries/index.js'
// export * from './drizzle/queries/index.js'  // Drizzle driver (dormant on fly/eaas)
