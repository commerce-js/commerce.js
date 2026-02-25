// ---------------------------------------------------------------------------
// @commercejs/platform — Drizzle driver tests
// ---------------------------------------------------------------------------

import { vi } from 'vitest'

// Mock the barrel to directly use Drizzle queries
vi.mock('../database/index.js', async () => {
  return await import('../database/drizzle/queries/index.js')
})

import { describe } from 'vitest'
import { sql } from 'drizzle-orm'
import { initDrizzle, resetDb, getDb } from '../database/drizzle/client.js'
import { migrateDrizzle } from '../database/drizzle/migrate.js'
import { seedDrizzle } from '../database/drizzle/seed.js'
import { platformTestSuite } from './platform.suite.js'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required — create packages/platform/.env with your Neon connection string')
}

/**
 * Truncate all tables before re-seeding.
 * Uses CASCADE to handle foreign key dependencies.
 */
async function cleanDatabase() {
  const db = getDb()
  await db.execute(sql`TRUNCATE
    return_items, returns,
    order_history, order_items, orders,
    cart_items, carts,
    wishlist_items, wishlists,
    reviews,
    coupons, promotions,
    product_tags, product_categories, product_attributes, product_option_values, product_options, product_variants, product_images, products,
    categories,
    customer_addresses, customers,
    brands, countries, store_info,
    profile_otp_codes, profile_merchant_links, profile_payment_methods, profile_addresses, profiles,
    admin_users
  CASCADE`)
}

describe('@commercejs/platform [drizzle]', () => {
  platformTestSuite({
    setup: async () => {
      resetDb()
      const db = initDrizzle(DATABASE_URL)
      await migrateDrizzle(DATABASE_URL)
      await cleanDatabase()
      await seedDrizzle(db)
    },
    setupEmpty: async () => {
      resetDb()
      initDrizzle(DATABASE_URL)
      await migrateDrizzle(DATABASE_URL)
      await cleanDatabase()
    },
  })
})
