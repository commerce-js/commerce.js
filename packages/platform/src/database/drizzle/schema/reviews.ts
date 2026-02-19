// ---------------------------------------------------------------------------
// Reviews schema
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { products } from './products.js'

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  verified: boolean('verified').notNull().default(false),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
