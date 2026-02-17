// ---------------------------------------------------------------------------
// Armada Delivery — config and raw API response types
// ---------------------------------------------------------------------------

/** Configuration for ArmadaDeliveryProvider */
export interface ArmadaProviderConfig {
  /** Armada API access token (Armada-Access-Token header) */
  accessToken: string
  /** API base URL override (default: https://api.armadadelivery.com/v1) */
  baseUrl?: string
  /** Custom fetch function for testing */
  fetchFn?: typeof fetch
}

// ---- Raw Armada API types --------------------------------------------------

/** Known Armada order status values */
export type ArmadaOrderStatus =
  | 'pending'
  | 'dispatched'
  | 'waiting_pack'
  | 'en_route'
  | 'completed'
  | 'canceled'
  | 'failed'

/** Raw Armada estimation response */
export interface ArmadaRawEstimate {
  delivery_fee: number
  currency: string
  estimated_pickup_at: string
  estimated_delivery_at: string
}

/** Raw Armada order/delivery response */
export interface ArmadaRawOrder {
  code: string
  status: ArmadaOrderStatus
  delivery_fee: number
  currency: string
  origin: {
    full_address?: string
    latitude?: number
    longitude?: number
    contact_name?: string
    contact_number?: string
  }
  destination: {
    full_address?: string
    latitude?: number
    longitude?: number
    contact_name?: string
    contact_number?: string
    special_instructions?: string
  }
  driver?: {
    name?: string
    phone?: string
    latitude?: number
    longitude?: number
  }
  reference?: string
  tracking_url?: string
  estimated_pickup_at?: string
  estimated_delivery_at?: string
  created_at: string
  updated_at?: string
}

/** Raw Armada webhook payload */
export interface ArmadaWebhookPayload {
  code: string
  status: ArmadaOrderStatus
  driver?: {
    name?: string
    phone?: string
    latitude?: number
    longitude?: number
  }
  [key: string]: unknown
}

/** Raw Armada API error response */
export interface ArmadaApiError {
  message: string
  status_code?: number
}
