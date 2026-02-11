// ---------------------------------------------------------------------------
// Brands schema
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const brands = sqliteTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
