// ---------------------------------------------------------------------------
// Promotions schema
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, numeric, doublePrecision, timestamp } from 'drizzle-orm/pg-core'

export const promotions = pgTable('promotions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  discountType: text('discount_type').notNull().default('percentage'),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: text('currency'),
  maxDiscount: numeric('max_discount', { precision: 12, scale: 2 }),
  target: text('target').notNull().default('order'),
  conditionsJson: text('conditions_json'), // JSON blob for PromotionCondition
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  requiresCoupon: boolean('requires_coupon').notNull().default(false),
  usageLimitPerCustomer: integer('usage_limit_per_customer'),
  usageLimitTotal: integer('usage_limit_total'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  promotionId: text('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
  isValid: boolean('is_valid').notNull().default(true),
  invalidReason: text('invalid_reason'),
  timesUsed: integer('times_used').notNull().default(0),
})
