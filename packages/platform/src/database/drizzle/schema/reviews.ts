// ---------------------------------------------------------------------------
// Reviews schema
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { products } from './products.js'

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('published'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
