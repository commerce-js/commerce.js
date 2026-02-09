// ---------------------------------------------------------------------------
// Wholesale / B2B commerce types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe, Price, PaginatedResult } from './common.js'

// ---- Volume Pricing ----

/** A single tier in volume-based pricing */
export interface PriceTier {
  /** Minimum quantity to unlock this price */
  minQuantity: number
  /** Maximum quantity for this tier (null = unlimited) */
  maxQuantity: Maybe<number>
  /** Price per unit at this tier */
  unitPrice: Price
  /** Optional label (e.g., "Wholesale", "Bulk") */
  label: Maybe<LocalizedString>
}

// ---- Customer Groups ----

/** Customer segmentation for tiered pricing / access control */
export interface CustomerGroup {
  id: Id
  /** Group identifier (e.g., "wholesale", "retail", "vip", "distributor") */
  code: string
  name: LocalizedString
  /** Whether members get wholesale pricing */
  isWholesale: boolean
  /** Discount percentage applied to all products for this group (0 = none) */
  defaultDiscount: number
  /** Minimum order value for this group (null = none) */
  minimumOrderValue: Maybe<Price>
}

/** Per-group pricing override on a product */
export interface CustomerGroupPrice {
  groupId: Id
  groupCode: string
  unitPrice: Price
}

// ---- Request for Quote (RFQ) ----

export type QuoteStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'quoted'       // Seller has responded with pricing
  | 'accepted'     // Buyer accepted the quote
  | 'rejected'     // Buyer or seller rejected
  | 'expired'
  | 'converted'    // Quote converted to an order

export interface QuoteLineItem {
  productId: Id
  variantId: Maybe<Id>
  /** Requested quantity */
  quantity: number
  /** Buyer's target price (optional) */
  targetPrice: Maybe<Price>
  /** Seller's quoted price (populated when status = 'quoted') */
  quotedPrice: Maybe<Price>
  note: Maybe<string>
}

/** A request-for-quote from a buyer */
export interface QuoteRequest {
  id: Id
  status: QuoteStatus
  items: QuoteLineItem[]
  /** Total quoted amount (populated when status = 'quoted') */
  totalAmount: Maybe<Price>
  /** Company / buyer name */
  companyName: Maybe<string>
  /** Contact email */
  contactEmail: string
  /** Valid until date (ISO 8601) */
  expiresAt: Maybe<string>
  note: Maybe<string>
  /** Reference to order if quote was converted */
  orderId: Maybe<Id>
  createdAt: string
  updatedAt: string
}

/** Input for creating a quote request */
export interface CreateQuoteInput {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    targetPrice?: number
    note?: string
  }>
  companyName?: string
  contactEmail: string
  note?: string
}

// ---- Payment Terms (Net-30/60/90) ----

export type PaymentTermsType = 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'net_90' | 'due_on_receipt' | 'custom'

/** Payment terms for B2B orders */
export interface PaymentTerms {
  type: PaymentTermsType
  /** Number of days until payment is due (for 'custom') */
  dueDays: number
  /** Due date (ISO 8601) */
  dueDate: Maybe<string>
  /** Whether a deposit is required upfront */
  depositRequired: boolean
  /** Deposit percentage (0–100) */
  depositPercentage: number
}
