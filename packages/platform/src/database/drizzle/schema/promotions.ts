// ---------------------------------------------------------------------------
// Promotions schema
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const promotions = sqliteTable('promotions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  discountType: text('discount_type').notNull().default('percentage'),
  discountValue: real('discount_value').notNull().default(0),
  currency: text('currency'),
  maxDiscount: real('max_discount'),
  target: text('target').notNull().default('order'),
  conditionsJson: text('conditions_json'), // JSON blob for PromotionCondition
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  requiresCoupon: integer('requires_coupon', { mode: 'boolean' }).notNull().default(false),
  usageLimitPerCustomer: integer('usage_limit_per_customer'),
  usageLimitTotal: integer('usage_limit_total'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  promotionId: text('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  isValid: integer('is_valid', { mode: 'boolean' }).notNull().default(true),
  invalidReason: text('invalid_reason'),
  timesUsed: integer('times_used').notNull().default(0),
})
