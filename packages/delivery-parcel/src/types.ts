// ---------------------------------------------------------------------------
// Parcel Delivery — config and raw API response types
// ---------------------------------------------------------------------------

/** Configuration for ParcelDeliveryProvider */
export interface ParcelProviderConfig {
  /** OAuth2 client ID */
  clientId: string
  /** OAuth2 client secret */
  clientSecret: string
  /** Secret for webhook payload verification */
  webhookSecret?: string
  /** Region header value (e.g., 'SA-riyadh', 'BH-manama') */
  region?: string
  /** API base URL override (default: https://api.tryparcel.com/api) */
  baseUrl?: string
  /** Custom fetch function for testing */
  fetchFn?: typeof fetch
}

// ---- OAuth ----------------------------------------------------------------

/** Parcel OAuth2 token response */
export interface ParcelOAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// ---- Task types -----------------------------------------------------------

/** Known Parcel task/delivery status values */
export type ParcelTaskStatus =
  | 'Unassigned'
  | 'Acquiring Location'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Successful'
  | 'Canceled'
  | 'Location Inquiry Expired'

/** Raw Parcel delivery (within a task) */
export interface ParcelRawDelivery {
  _id: string
  status: ParcelTaskStatus
  address: {
    name?: string
    phone?: string
    formatted_address?: string
    location?: { lat: number; lng: number }
  }
  duration?: number
  distance?: number
  notes?: string
}

/** Raw Parcel task response */
export interface ParcelRawTask {
  _id: string
  taskRelation: string
  status: ParcelTaskStatus
  pickup: {
    name?: string
    phone?: string
    formatted_address?: string
    address?: {
      location?: { lat: number; lng: number }
    }
  }
  deliveries: ParcelRawDelivery[]
  taskFees?: number
  currency?: string
  driver?: {
    name?: string
    phone?: string
    location?: { lat: number; lng: number }
  }
  trackingUrl?: string
  createdAt: string
  updatedAt?: string
}

/** Raw Parcel price estimation response */
export interface ParcelRawPriceEstimate {
  taskFees: number
  deliveries: Array<{
    pointFees: number
    duration: number   // minutes
    distance: number   // meters
  }>
}

/** Raw Parcel webhook payload */
export interface ParcelWebhookPayload {
  hookType: string
  WebhookSecret: string
  data: {
    taskRelation: string
    status: ParcelTaskStatus
    driver?: {
      name?: string
      phone?: string
      location?: { lat: number; lng: number }
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

/** Parcel API response wrapper */
export interface ParcelApiResponse<T> {
  status: number
  code: string
  message: string
  data: T
}

/** Raw Parcel API error */
export interface ParcelApiError {
  status: number
  code: string
  message: string
}
