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

// Database (Drizzle + Neon serverless — no WASM)
export { initDrizzle, getDrizzleDb, getDb, migrateDrizzle, seedDrizzle } from './database/index.js'
export type { DrizzleDatabase } from './database/drizzle/client.js'

// Prisma (dormant — commented out to prevent WASM bundling)
// export { initPrisma, getPrismaDb, migratePrisma } from './database/index.js'
// export type { PrismaDatabase } from './database/prisma/client.js'
// export { seedPrisma } from './database/prisma/seed.js'

// Drizzle schema (for raw queries)
export * as schema from './database/drizzle/schema/index.js'

// Domain factories (for standalone use outside the adapter)
export { createCartDomain } from './domains/cart.js'
export { createCheckoutDomain } from './domains/checkout.js'
export { createCatalogDomain } from './domains/catalog.js'
export { createOrdersDomain } from './domains/orders.js'
export { createProfileDomain } from './domains/profile.js'

// Profile queries (direct access for Cloud Identity API routes)
export {
  findProfileById,
  findProfileByEmail,
  findProfileByPhone,
  createProfile,
  updateProfile,
  deleteProfile,
  findProfileAddresses,
  findProfilePaymentMethods,
  findProfileMerchantLinks,
  upsertProfileMerchantLink,
  createOtpCode,
  findActiveOtpCode,
  markOtpVerified,
  incrementOtpAttempts,
  deleteExpiredOtpCodes,
} from './database/index.js'
