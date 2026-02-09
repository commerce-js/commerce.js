// ---------------------------------------------------------------------------
// Payment domain types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe } from './common.js'

/** Known GCC and international payment types */
export type PaymentType =
  | 'card'
  | 'mada'
  | 'apple_pay'
  | 'google_pay'
  | 'stc_pay'
  | 'tamara'
  | 'tabby'
  | 'tap'
  | 'cash_on_delivery'
  | 'bank_transfer'
  | 'sadad'
  | 'paypal'
  | 'custom'

/** Buy Now Pay Later installment details */
export interface Installment {
  count: number
  /** Amount per installment in smallest currency unit */
  amount: number
  currency: string
}

/** Payment method option */
export interface PaymentMethod {
  id: Id
  type: PaymentType | string
  name: LocalizedString
  provider: string
  /** BNPL installment info (for Tamara, Tabby, etc.) */
  installments: Maybe<Installment>
  /** Icon/logo URL */
  icon: Maybe<string>
}
