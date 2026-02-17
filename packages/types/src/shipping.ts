// ---------------------------------------------------------------------------
// Shipping domain types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Price } from './common.js'

/** Known GCC shipping providers */
export type ShippingProvider =
  | 'aramex'
  | 'smsa'
  | 'dhl'
  | 'fetchr'
  | 'jnt'
  | 'naqel'
  | 'zajil'
  | 'fedex'
  | 'ups'
  | 'custom'

/** How the order will be fulfilled */
export type FulfillmentType =
  | 'shipping'        // Traditional courier (Aramex, DHL, etc.)
  | 'local_delivery'  // Last-mile on-demand (Armada, Parcel, etc.)
  | 'pickup'          // Customer collects from store/branch

/** Shipping method option */
export interface ShippingMethod {
  id: Id
  name: LocalizedString
  provider: ShippingProvider | string
  /** How this method fulfills the order */
  fulfillmentType: FulfillmentType
  estimatedDays: {
    min: number
    max: number
  }
  /** Estimated delivery time in minutes — used for local_delivery */
  estimatedMinutes?: number
  price: Price
  /** Whether this method supports cash on delivery */
  cashOnDelivery: boolean
}
