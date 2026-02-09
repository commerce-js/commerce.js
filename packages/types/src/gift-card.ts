// ---------------------------------------------------------------------------
// Gift card types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe, Price } from './common.js'

/** Gift card status */
export type GiftCardStatus =
  | 'active'
  | 'inactive'     // Not yet activated
  | 'redeemed'     // Fully used
  | 'expired'
  | 'cancelled'

/** A gift card entity */
export interface GiftCard {
  id: Id
  /** Unique gift card code */
  code: string
  status: GiftCardStatus
  /** Original loaded amount */
  initialBalance: Price
  /** Current remaining balance */
  currentBalance: Price
  /** Currency code (gift cards are currency-specific) */
  currency: string
  /** Recipient name */
  recipientName: Maybe<string>
  /** Recipient email */
  recipientEmail: Maybe<string>
  /** Sender name */
  senderName: Maybe<string>
  /** Personal message from sender */
  message: Maybe<LocalizedString>
  /** Expiry date (ISO 8601, null = never expires) */
  expiresAt: Maybe<string>
  /** Whether this is a digital (emailed) or physical card */
  isDigital: boolean
  createdAt: string
}

/** Transaction on a gift card */
export interface GiftCardTransaction {
  id: Id
  giftCardId: Id
  /** Positive = credit (load), Negative = debit (redemption) */
  amount: Price
  /** Balance after this transaction */
  balanceAfter: Price
  /** Transaction type */
  type: 'load' | 'redemption' | 'refund' | 'expiry'
  /** Related order ID (for redemptions) */
  orderId: Maybe<Id>
  createdAt: string
}

/** Input for purchasing a gift card */
export interface PurchaseGiftCardInput {
  /** Amount to load */
  amount: number
  currency: string
  /** Recipient details (for sending as a gift) */
  recipientEmail?: string
  recipientName?: string
  senderName?: string
  message?: string
  /** Whether to send a digital card via email */
  isDigital?: boolean
}

/** Input for redeeming a gift card at checkout */
export interface RedeemGiftCardInput {
  /** Gift card code */
  code: string
  /** Amount to apply (null = apply full balance) */
  amount?: number
}
