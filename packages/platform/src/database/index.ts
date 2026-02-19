// ---------------------------------------------------------------------------
// Database barrel export
// ---------------------------------------------------------------------------

// Drizzle (active driver — Neon serverless, no WASM)
export { initDrizzle, getDb as getDrizzleDb } from './drizzle/client.js'
export { getDb } from './drizzle/client.js'
export type { DrizzleDatabase } from './drizzle/client.js'
export { migrateDrizzle } from './drizzle/migrate.js'
export { seedDrizzle } from './drizzle/seed.js'

// Prisma (dormant — commented out to prevent WASM bundling)
// export { initPrisma, getDb, getDb as getPrismaDb } from './prisma/client.js'
// export type { PrismaDatabase } from './prisma/client.js'
// export { migratePrisma } from './prisma/migrate.js'

// Queries (from active driver — swap this line to switch drivers)
export * from './drizzle/queries/index.js'
// export * from './prisma/queries/index.js'  // Prisma driver (dormant)

