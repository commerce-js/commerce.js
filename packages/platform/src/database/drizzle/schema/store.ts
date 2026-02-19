// ---------------------------------------------------------------------------
// Store schema — single-row store configuration
// ---------------------------------------------------------------------------

import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const storeInfo = pgTable('store_info', {
  id: text('id').primaryKey().default('default'),
  name: text('name').notNull().default('My Store'),
  nameAr: text('name_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  logo: text('logo'),
  favicon: text('favicon'),
  currency: text('currency').notNull().default('SAR'),
  locale: text('locale').notNull().default('en'),
  supportedCurrencies: jsonb('supported_currencies').$type<string[]>().default(['SAR']),
  supportedLocales: jsonb('supported_locales').$type<string[]>().default(['en', 'ar']),
  timezone: text('timezone').notNull().default('Asia/Riyadh'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
