// ---------------------------------------------------------------------------
// Categories schema — hierarchical category tree
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  image: text('image'),
  parentId: text('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
