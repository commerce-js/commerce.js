// ---------------------------------------------------------------------------
// Cart domain types
// ---------------------------------------------------------------------------

import type { DiscountablePrice, Id, Image, LocalizedString, Maybe, Price } from './common.js'
import type { Address } from './customer.js'
import type { ShippingMethod } from './shipping.js'
import type { PaymentMethod } from './payment.js'

/** A single item in the cart */
export interface CartItem {
  id: Id
  productId: Id
  /** Slug for constructing product URLs (falls back to productId if not set) */
  productSlug?: string
  variantId: Maybe<Id>
  name: LocalizedString
  /** Display name for the selected variant (e.g. "Black / XL") */
  variantName?: LocalizedString
  image: Maybe<Image>
  quantity: number
  /** Unit price */
  price: DiscountablePrice
  /** Quantity × unit price */
  totalPrice: Price
}

/** Aggregated cart totals */
export interface CartTotals {
  subtotal: Price
  shipping: Maybe<Price>
  tax: Maybe<Price>
  discount: Maybe<Price>
  total: Price
}

/** Shopping cart */
export interface Cart {
  id: Id
  items: CartItem[]
  totals: CartTotals
  shippingAddress: Maybe<Address>
  billingAddress: Maybe<Address>
  shippingMethod: Maybe<ShippingMethod>
  paymentMethod: Maybe<PaymentMethod>
  couponCode: Maybe<string>
  /** Associated customer (null for guest carts) */
  customerId: Maybe<Id>
  itemCount: number
  createdAt: string
  updatedAt: string
}
