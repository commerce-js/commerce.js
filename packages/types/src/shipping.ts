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

/** Shipping method option */
export interface ShippingMethod {
  id: Id
  name: LocalizedString
  provider: ShippingProvider | string
  estimatedDays: {
    min: number
    max: number
  }
  price: Price
  /** Whether this method supports cash on delivery */
  cashOnDelivery: boolean
}
