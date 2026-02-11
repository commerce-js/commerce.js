// ---------------------------------------------------------------------------
// Database barrel export
// ---------------------------------------------------------------------------

// Drizzle
export { initDrizzle, getDb as getDrizzleDb } from './drizzle/client.js'
export type { DrizzleDatabase } from './drizzle/client.js'
export { migrateDrizzle } from './drizzle/migrate.js'

// Prisma
export { initPrisma, getDb as getPrismaDb } from './prisma/client.js'
export type { PrismaDatabase } from './prisma/client.js'
export { migratePrisma } from './prisma/migrate.js'

// Queries (from active driver — swap this line to switch drivers)
export * from './prisma/queries/index.js'
