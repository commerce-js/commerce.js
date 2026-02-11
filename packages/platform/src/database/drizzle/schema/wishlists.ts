// ---------------------------------------------------------------------------
// Wishlists schema
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { customers } from './customers.js'
import { products } from './products.js'

export const wishlists = sqliteTable('wishlists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const wishlistItems = sqliteTable('wishlist_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  wishlistId: text('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id'),
  addedAt: text('added_at').notNull().$defaultFn(() => new Date().toISOString()),
})
