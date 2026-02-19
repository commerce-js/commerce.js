// ---------------------------------------------------------------------------
// Categories schema — hierarchical category tree
// ---------------------------------------------------------------------------

import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  image: text('image'),
  parentId: text('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
