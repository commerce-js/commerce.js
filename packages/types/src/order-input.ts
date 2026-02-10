// ---------------------------------------------------------------------------
// Order creation input types
// ---------------------------------------------------------------------------
// Used by OrderAdapter.createOrder() — platform-agnostic order creation.
// The checkout engine (or any caller) builds this from cart + session data
// and the adapter maps it to the platform's API shape.
// ---------------------------------------------------------------------------

import type { Id, Maybe, Price } from './common.js'
import type { Address } from './customer.js'

/** A single item to include in the order */
export interface OrderItemInput {
  productId: Id
  variantId?: Maybe<Id>
  quantity: number
  /** Unit price at time of order (for validation) */
  unitPrice: Price
  /** Optional notes on the line item */
  notes?: Maybe<string>
}

/** Input for creating a new order via the adapter */
export interface CreateOrderInput {
  /** Items to include in the order */
  items: OrderItemInput[]

  /** Customer ID if known (existing customer) */
  customerId?: Maybe<Id>

  /** Receiver info if no customerId (guest checkout) */
  receiver?: Maybe<{
    firstName: string
    lastName: string
    email: string
    phone?: string
  }>

  /** Shipping address */
  shippingAddress: Omit<Address, 'id' | 'isDefault'>

  /** Billing address (defaults to shipping if not provided) */
  billingAddress?: Maybe<Omit<Address, 'id' | 'isDefault'>>

  /** Selected shipping method ID */
  shippingMethodId?: Maybe<string>

  /** Payment method or reference */
  payment?: Maybe<{
    /** Payment method ID or type */
    methodId: string
    /** External transaction reference (e.g., Stripe PaymentIntent ID) */
    transactionId?: string
  }>

  /** Coupon or discount code applied */
  couponCode?: Maybe<string>

  /** Customer-facing order note */
  note?: Maybe<string>

  /** Custom metadata (adapter-specific extensions) */
  metadata?: Maybe<Record<string, unknown>>
}
