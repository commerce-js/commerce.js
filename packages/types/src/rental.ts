// ---------------------------------------------------------------------------
// Rental / booking types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe, Price } from './common.js'

/** Rental pricing unit */
export type RentalPricingUnit = 'hourly' | 'daily' | 'weekly' | 'monthly'

/** Rental product metadata */
export interface RentalProductMeta {
  /** Primary pricing unit */
  pricingUnit: RentalPricingUnit
  /** Price per unit */
  pricePerUnit: Price
  /** Discounted pricing for longer durations */
  pricingTiers: Maybe<RentalPricingTier[]>
  /** Security deposit amount (null = no deposit) */
  securityDeposit: Maybe<Price>
  /** Minimum rental duration (in pricingUnit units) */
  minDuration: number
  /** Maximum rental duration (null = unlimited) */
  maxDuration: Maybe<number>
  /** Whether pickup/delivery is required (vs. fully digital) */
  requiresPickup: boolean
  /** Pickup / return location */
  location: Maybe<LocalizedString>
  /** Late return fee per unit */
  lateFeePerUnit: Maybe<Price>
  /** Preparation time before item is available (hours) */
  preparationTime: Maybe<number>
}

/** Pricing tier for longer rental durations */
export interface RentalPricingTier {
  /** Minimum # of units to qualify */
  minUnits: number
  /** Price per unit at this tier */
  pricePerUnit: Price
  /** Optional label (e.g., "Weekly Rate") */
  label: Maybe<LocalizedString>
}

/** A time slot for availability */
export interface AvailabilitySlot {
  /** Start time (ISO 8601) */
  startDate: string
  /** End time (ISO 8601) */
  endDate: string
  /** Number of units available in this slot */
  availableQuantity: number
  /** Whether this slot is fully booked */
  isBooked: boolean
}

/** Rental booking status */
export type RentalBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'        // Currently rented out
  | 'returned'
  | 'overdue'
  | 'cancelled'

/** A rental booking entity */
export interface RentalBooking {
  id: Id
  productId: Id
  customerId: Id
  status: RentalBookingStatus
  /** Rental start (ISO 8601) */
  startDate: string
  /** Rental end (ISO 8601) */
  endDate: string
  /** Actual return date (ISO 8601, null if not yet returned) */
  returnedAt: Maybe<string>
  /** Pricing unit used */
  pricingUnit: RentalPricingUnit
  /** Number of pricing units */
  duration: number
  /** Total rental cost */
  totalPrice: Price
  /** Security deposit amount held */
  depositAmount: Maybe<Price>
  /** Whether deposit has been refunded */
  depositRefunded: boolean
  /** Late fees accrued */
  lateFees: Maybe<Price>
  /** Related order ID */
  orderId: Maybe<Id>
  createdAt: string
}

/** Input for creating a rental booking */
export interface CreateRentalBookingInput {
  productId: string
  startDate: string
  endDate: string
  quantity?: number
}
