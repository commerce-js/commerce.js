// ---------------------------------------------------------------------------
// @commercejs/platform — native commerce engine
// ---------------------------------------------------------------------------
// Own your data. No external platform required.
// ---------------------------------------------------------------------------

// Adapter
export { createPlatformAdapter } from './adapter.js'
export type { PlatformAdapterResult } from './adapter.js'

// Admin API
export { createAdminAPI } from './admin/index.js'
export type { AdminAPI } from './admin/types.js'
export type {
  AdminUser,
  AdminUserSafe,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AdminListOrdersParams,
  FulfillOrderInput,
  UpdateStoreInput,
  StoreSettings,
  UpdateInventoryInput,
  DashboardStats,
  AdminListParams,
} from './admin/types.js'

// Config
export type { PlatformConfig } from './types.js'

// Database (PostgreSQL via Neon adapter)
export { initPrisma, getPrismaDb, getDb, migratePrisma } from './database/index.js'
export type { PrismaDatabase } from './database/prisma/client.js'

// Drizzle (secondary driver — for raw queries)
export { initDrizzle, getDrizzleDb, migrateDrizzle } from './database/index.js'
export type { DrizzleDatabase } from './database/drizzle/client.js'

// Seed
export { seedDrizzle } from './database/drizzle/seed.js'
export { seedPrisma } from './database/prisma/seed.js'

// Drizzle schema (for raw queries — Prisma users access models via the client directly)
export * as schema from './database/drizzle/schema/index.js'
