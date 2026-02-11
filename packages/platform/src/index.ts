// ---------------------------------------------------------------------------
// @commercejs/platform — native commerce engine
// ---------------------------------------------------------------------------
// Own your data. No external platform required.
// ---------------------------------------------------------------------------

// Adapter
export { createPlatformAdapter } from './adapter.js'

// Config
export type { PlatformConfig } from './types.js'

// Database
export { initDrizzle, getDrizzleDb, migrateDrizzle, initPrisma, getPrismaDb, migratePrisma } from './database/index.js'
export type { DrizzleDatabase } from './database/drizzle/client.js'
export type { PrismaDatabase } from './database/prisma/client.js'

// Seed
export { seedDrizzle } from './database/drizzle/seed.js'
export { seedPrisma } from './database/prisma/seed.js'

// Drizzle schema (for raw queries — Prisma users access models via the client directly)
export * as schema from './database/drizzle/schema/index.js'
