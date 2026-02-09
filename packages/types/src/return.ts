// ---------------------------------------------------------------------------
// Return & refund types
// ---------------------------------------------------------------------------

import type { Id, Image, LocalizedString, Maybe, Price } from './common.js'

/** Reason for returning an item */
export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'changed_mind'
  | 'size_fit'
  | 'arrived_late'
  | 'damaged_in_shipping'
  | 'other'

/** Return request status lifecycle */
export type ReturnStatus =
  | 'requested'         // customer submitted the request
  | 'approved'          // merchant approved the return
  | 'rejected'          // merchant declined the return
  | 'shipped'           // customer shipped return items
  | 'received'          // merchant received the returned items
  | 'refunded'          // refund has been processed
  | 'cancelled'         // customer cancelled the return request

/** Refund method — how the money is returned */
export type RefundMethod =
  | 'original_payment'  // back to original payment method
  | 'store_credit'      // credit to customer's account
  | 'bank_transfer'     // direct bank transfer
  | 'wallet'            // in-app wallet

/** A single item within a return request */
export interface ReturnItem {
  id: Id
  /** Original order item ID */
  orderItemId: Id
  productId: Id
  variantId: Maybe<Id>
  name: LocalizedString
  image: Maybe<Image>
  /** Quantity being returned */
  quantity: number
  /** Reason for this item's return */
  reason: ReturnReason
  /** Customer's description of the issue */
  reasonNote: Maybe<string>
  /** Photos of damage / issue (customer-uploaded) */
  evidenceImages: Image[]
}

/** Input for creating a return request */
export interface CreateReturnInput {
  /** Order ID to return items from */
  orderId: string
  /** Items to return */
  items: Array<{
    orderItemId: string
    quantity: number
    reason: ReturnReason
    reasonNote?: string
  }>
  /** Preferred refund method */
  preferredRefundMethod?: RefundMethod
}

/** A return request entity */
export interface ReturnRequest {
  id: Id
  /** Original order ID */
  orderId: Id
  /** Original order number (for display) */
  orderNumber: string
  status: ReturnStatus
  items: ReturnItem[]
  /** Total refund amount */
  refundAmount: Maybe<Price>
  /** How the refund will be processed */
  refundMethod: Maybe<RefundMethod>
  /** Return shipping label URL (provided by merchant) */
  returnShippingLabel: Maybe<string>
  /** Tracking number for return shipment */
  returnTrackingNumber: Maybe<string>
  /** Merchant notes (e.g., rejection reason) */
  merchantNote: Maybe<string>
  /** Customer notes */
  customerNote: Maybe<string>
  createdAt: string
  updatedAt: string
}
