// ---------------------------------------------------------------------------
// Query layer — centralized Prisma DB operations
//
// Each module owns one domain. All functions take a PrismaDatabase as the
// first argument so they work for any merchant DB (multi-tenant safe).
//
// Usage:
//   import { findProductBySlug, findCart, createOrder } from './queries/index.js'
//   const product = await findProductBySlug(db, slug)
// ---------------------------------------------------------------------------

export * from './product.queries.js'
export * from './category.queries.js'
export * from './cart.queries.js'
export * from './order.queries.js'
export * from './customer.queries.js'
export * from './store.queries.js'
