// ---------------------------------------------------------------------------
// Brands schema
// ---------------------------------------------------------------------------

import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
