// ---------------------------------------------------------------------------
// Promotion & discount types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe, Price } from './common.js'

/** How the discount value is applied */
export type DiscountType =
  | 'percentage'        // e.g., 20% off
  | 'fixed_amount'      // e.g., 50 SAR off
  | 'free_shipping'     // waive shipping cost
  | 'buy_x_get_y'       // buy 2 get 1 free
  | 'bundle'            // bundle pricing

/** What the promotion applies to */
export type PromotionTarget =
  | 'order'             // entire order
  | 'product'           // specific products
  | 'category'          // specific categories
  | 'shipping'          // shipping cost
  | 'customer'          // specific customer segments

/** Minimum requirements to qualify for a promotion */
export interface PromotionCondition {
  /** Minimum order subtotal */
  minPurchaseAmount: Maybe<Price>
  /** Minimum item count in cart */
  minItemCount: Maybe<number>
  /** Required product IDs (for product-specific promos) */
  productIds: Maybe<string[]>
  /** Required category IDs (for category-specific promos) */
  categoryIds: Maybe<string[]>
  /** First-time customer only */
  firstOrderOnly: boolean
}

/** A promotion / discount campaign */
export interface Promotion {
  id: Id
  /** Display name */
  name: LocalizedString
  /** Description / terms */
  description: Maybe<LocalizedString>
  /** Discount mechanism */
  discountType: DiscountType
  /** Discount value — percentage (0–100) or fixed amount */
  discountValue: number
  /** Currency for fixed_amount discounts */
  currency: Maybe<string>
  /** Maximum discount cap for percentage discounts (null = uncapped) */
  maxDiscount: Maybe<Price>
  /** What does this promotion apply to */
  target: PromotionTarget
  /** Conditions that must be met */
  conditions: PromotionCondition
  /** Start date (ISO 8601) */
  startsAt: string
  /** End date (ISO 8601, null = no end) */
  endsAt: Maybe<string>
  /** Whether this promotion is currently active */
  isActive: boolean
  /** Whether a coupon code is required to activate */
  requiresCoupon: boolean
  /** Usage limit per customer (null = unlimited) */
  usageLimitPerCustomer: Maybe<number>
  /** Total usage limit (null = unlimited) */
  usageLimitTotal: Maybe<number>
}

/** A redeemable coupon code */
export interface Coupon {
  id: Id
  /** The code the customer enters (e.g., "SAVE20") */
  code: string
  /** Associated promotion */
  promotion: Promotion
  /** Whether this coupon is still valid */
  isValid: boolean
  /** Reason if invalid (e.g., "expired", "usage_limit_reached") */
  invalidReason: Maybe<string>
  /** Number of times this coupon has been used */
  timesUsed: number
}
