// ---------------------------------------------------------------------------
// Orders schema — orders, line items, and status history
// ---------------------------------------------------------------------------

import { pgTable, text, integer, boolean, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { customers } from './customers.js'

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // Status
  status: text('status').notNull().default('pending'),

  // Totals
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  shippingCost: numeric('shipping_cost', { precision: 12, scale: 2 }),
  tax: numeric('tax', { precision: 12, scale: 2 }),
  discount: numeric('discount', { precision: 12, scale: 2 }),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: text('currency').notNull().default('SAR'),

  // Addresses (JSON snapshots)
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),

  // Shipping
  shippingMethod: text('shipping_method'),
  paymentMethod: text('payment_method'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),

  // Misc
  note: text('note'),
  requiresShipping: boolean('requires_shipping').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  variantId: text('variant_id'),

  // Snapshot at time of purchase
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  image: text('image'),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),

  // Product type info
  productType: text('product_type').notNull().default('physical'),
  fulfillmentStatus: text('fulfillment_status').notNull().default('unfulfilled'),
})

export const orderHistory = pgTable('order_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
