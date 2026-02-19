// ---------------------------------------------------------------------------
// Wishlists schema
// ---------------------------------------------------------------------------

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { customers } from './customers.js'
import { products } from './products.js'

export const wishlists = pgTable('wishlists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const wishlistItems = pgTable('wishlist_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  wishlistId: text('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
})
