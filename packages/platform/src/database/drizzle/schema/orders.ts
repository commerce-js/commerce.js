// ---------------------------------------------------------------------------
// Orders schema — orders, line items, and status history
// ---------------------------------------------------------------------------

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { customers } from './customers.js'

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // Status
  status: text('status', {
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
  }).notNull().default('pending'),

  // Totals
  subtotal: real('subtotal').notNull().default(0),
  shippingCost: real('shipping_cost'),
  tax: real('tax'),
  discount: real('discount'),
  total: real('total').notNull().default(0),
  currency: text('currency').notNull().default('SAR'),

  // Addresses (JSON snapshots)
  shippingAddress: text('shipping_address', { mode: 'json' }),
  billingAddress: text('billing_address', { mode: 'json' }),

  // Shipping
  shippingMethod: text('shipping_method'),
  paymentMethod: text('payment_method'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),

  // Misc
  note: text('note'),
  requiresShipping: integer('requires_shipping', { mode: 'boolean' }).notNull().default(true),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  variantId: text('variant_id'),

  // Snapshot at time of purchase
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  image: text('image'),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  totalPrice: real('total_price').notNull(),

  // Product type info
  productType: text('product_type', {
    enum: ['physical', 'digital', 'service', 'event', 'subscription', 'auction', 'rental', 'gift_card'],
  }).notNull().default('physical'),

  fulfillmentStatus: text('fulfillment_status', {
    enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned', 'download_ready', 'license_sent', 'access_granted', 'ticket_issued'],
  }).notNull().default('unfulfilled'),
})

export const orderHistory = sqliteTable('order_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
