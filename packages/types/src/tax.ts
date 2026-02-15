// ---------------------------------------------------------------------------
// Tax Provider — pluggable tax calculation
// ---------------------------------------------------------------------------

/**
 * Input for a tax calculation request.
 */
export interface TaxCalculationInput {
  /** Line items to calculate tax for */
  lineItems: TaxLineItem[]

  /** Shipping address (for nexus determination) */
  shippingAddress: {
    country: string
    state?: string
    city?: string
    postalCode?: string
  }

  /** Customer tax exemption status */
  customerExempt?: boolean

  /** Currency code */
  currency: string
}

/**
 * A single line item for tax calculation.
 */
export interface TaxLineItem {
  /** Unique identifier for this line item */
  id: string

  /** Product tax code / category */
  taxCode?: string

  /** Unit price before tax */
  amount: number

  /** Quantity */
  quantity: number

  /** Discount amount applied to this line item */
  discount?: number
}

/**
 * Result of a tax calculation.
 */
export interface TaxResult {
  /** Total tax amount */
  totalTax: number

  /** Tax rate applied (as a decimal, e.g., 0.15 for 15%) */
  rate: number

  /** Breakdown by line item */
  lineItems: TaxLineItemResult[]

  /** Provider-specific transaction ID (for commit/void) */
  transactionId?: string
}

/**
 * Tax result for a single line item.
 */
export interface TaxLineItemResult {
  /** Line item ID (matches input) */
  id: string

  /** Tax amount for this line item */
  tax: number

  /** Effective tax rate */
  rate: number
}

/**
 * TaxProvider — the interface for pluggable tax calculation services.
 *
 * Providers implement this to calculate tax for cart line items
 * based on shipping address and product tax codes.
 *
 * @example
 * ```ts
 * const taxjar: TaxProvider = {
 *   id: 'taxjar',
 *   name: 'TaxJar',
 *   calculate: async (input) => { ... },
 *   commit: async (orderId) => { ... },
 *   void: async (transactionId) => { ... },
 * }
 * ```
 */
export interface TaxProvider {
  /** Unique provider identifier */
  readonly id: string

  /** Human-readable name */
  readonly name: string

  /** Calculate tax for the given line items + address */
  calculate(input: TaxCalculationInput): Promise<TaxResult>

  /** Commit/finalize a tax calculation (after order is placed) */
  commit(orderId: string, transactionId: string): Promise<void>

  /** Void a previously committed tax transaction (for refunds/cancellations) */
  void(transactionId: string): Promise<void>
}
