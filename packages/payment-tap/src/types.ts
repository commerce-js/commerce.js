// ---------------------------------------------------------------------------
// Tap Payments — config and raw API response types
// ---------------------------------------------------------------------------

/** Configuration for TapPaymentProvider */
export interface TapConfig {
  /** Tap secret API key (sk_test_... or sk_live_...) */
  secretKey: string
  /** Tap webhook secret for signature verification (optional) */
  webhookSecret?: string
  /** Use live mode (defaults to auto-detect from key prefix) */
  liveMode?: boolean
  /** API base URL override (for testing) */
  baseUrl?: string
}

// ---- Raw Tap API types ----------------------------------------------------

/** Tap charge object (subset of fields we use) */
export interface TapRawCharge {
  id: string
  status: TapChargeStatus
  amount: number
  currency: string
  threeDSecure: boolean
  description?: string
  reference?: {
    transaction?: string
    order?: string
  }
  transaction?: {
    url?: string
    created?: string
    authorization_id?: string
  }
  redirect?: {
    status?: string
    url?: string
  }
  source?: {
    id: string
    type: string
    payment_method?: string
    payment_type?: string
  }
  customer?: {
    id?: string
    first_name?: string
    last_name?: string
    email?: string
  }
  metadata?: Record<string, unknown>
  created: string
}

/** Known Tap charge status values */
export type TapChargeStatus =
  | 'INITIATED'
  | 'IN_PROGRESS'
  | 'ABANDONED'
  | 'CAPTURED'
  | 'VOID'
  | 'CANCELLED'
  | 'FAILED'
  | 'DECLINED'
  | 'RESTRICTED'
  | 'REFUNDED'
  | 'TIMEDOUT'

/** Tap refund response */
export interface TapRawRefund {
  id: string
  status: string
  amount: number
  currency: string
  charge_id: string
  reason?: string
  created: string
}
