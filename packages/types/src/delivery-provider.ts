// ---------------------------------------------------------------------------
// DeliveryProvider — pluggable last-mile delivery interface (Strategy pattern)
// ---------------------------------------------------------------------------
//
// Each delivery service (Armada, Parcel, etc.) implements this interface.
// The lifecycle is: `estimate → createDelivery → getDelivery → cancelDelivery`.
// Optional `verifyWebhook` supports webhook-driven status updates.
// ---------------------------------------------------------------------------

// ---- Delivery status -------------------------------------------------------

/** Normalized delivery status across all providers */
export type DeliveryStatus =
  | 'pending'       // Created, awaiting driver assignment
  | 'assigned'      // Driver assigned (Armada: dispatched, Parcel: assigned/accepted)
  | 'pickup'        // Driver at pickup location (Armada: waiting_pack)
  | 'in_transit'    // On the way to destination (Armada: en_route, Parcel: in_progress)
  | 'delivered'     // Successfully delivered (Armada: completed, Parcel: successful)
  | 'cancelled'     // Cancelled by merchant or system
  | 'failed'        // No driver found or delivery failed

// ---- Address ---------------------------------------------------------------

/** Delivery address with optional coordinates */
export interface DeliveryAddress {
  /** Recipient or sender name */
  contactName: string
  /** Phone number (E.164 recommended) */
  contactPhone: string
  /** Street address / first line */
  firstLine: string
  /** Additional address details */
  secondLine?: string
  /** City name */
  city?: string
  /** State / province / governorate */
  state?: string
  /** Postal / ZIP code */
  postalCode?: string
  /** ISO 3166-1 alpha-2 country code */
  country?: string
  /** Latitude — required by some providers (e.g., Armada) */
  latitude?: number
  /** Longitude — required by some providers (e.g., Armada) */
  longitude?: number
  /** Delivery instructions (e.g., "Ring the bell", "Leave at door") */
  instructions?: string
}

// ---- Estimation ------------------------------------------------------------

/** Result of a delivery fee/time estimation */
export interface DeliveryEstimate {
  /** Estimated delivery fee */
  fee: number
  /** ISO 4217 currency code (e.g., 'KWD', 'BHD', 'SAR') */
  currency: string
  /** Estimated delivery duration in minutes */
  estimatedDuration?: number
  /** Estimated distance in meters */
  estimatedDistance?: number
  /** Provider-specific data */
  providerData?: Record<string, unknown>
}

/** Input for estimating a delivery */
export interface EstimateDeliveryInput {
  /** Origin — either a full address or a branch reference */
  origin: DeliveryAddress | { branchId: string }
  /** Destination address */
  destination: DeliveryAddress
  /** Scheduled pickup time (ISO 8601) — for scheduled deliveries */
  scheduledAt?: string
}

// ---- Delivery --------------------------------------------------------------

/** A delivery task — the unit of work for a last-mile delivery */
export interface Delivery {
  /** Unique delivery identifier (provider-scoped) */
  id: string
  /** Which provider created this delivery */
  providerId: string
  /** Current delivery status */
  status: DeliveryStatus
  /** Pickup address */
  origin: DeliveryAddress
  /** Drop-off address */
  destination: DeliveryAddress
  /** Delivery fee charged */
  fee: number
  /** ISO 4217 currency code */
  currency: string
  /** Live tracking URL (e.g., Armada provides embedded tracking) */
  trackingUrl?: string
  /** Assigned driver details */
  driver?: {
    name: string
    phone: string
    latitude?: number
    longitude?: number
  }
  /** Estimated delivery duration in minutes */
  estimatedDuration?: number
  /** Estimated distance in meters */
  estimatedDistance?: number
  /** Associated Commerce.js order ID */
  orderId?: string
  /** Provider-specific data */
  providerData?: Record<string, unknown>
  /** When the delivery was created (ISO 8601) */
  createdAt: string
  /** When the delivery was last updated (ISO 8601) */
  updatedAt?: string
}

// ---- Create input ----------------------------------------------------------

/** Input for creating a new delivery */
export interface CreateDeliveryInput {
  /** Origin — full address or branch reference */
  origin: DeliveryAddress | { branchId: string }
  /** Destination address */
  destination: DeliveryAddress
  /** Associated Commerce.js order ID */
  orderId?: string
  /** Payment collection at delivery */
  payment?: {
    /** Amount to collect */
    amount: number
    /** Cash on delivery vs prepaid (wallet-funded) */
    type: 'cash' | 'prepaid'
  }
  /** Items being delivered (for driver reference) */
  items?: Array<{
    name: string
    quantity: number
    notes?: string
  }>
  /** Scheduled pickup time (ISO 8601) */
  scheduledAt?: string
  /** Arbitrary metadata passed to the provider */
  metadata?: Record<string, unknown>
}

// ---- Webhook event ---------------------------------------------------------

/** Parsed webhook event from a delivery provider */
export interface DeliveryWebhookEvent {
  /** Event type (e.g., 'delivery.updated', 'delivery.location') */
  type: string
  /** Related delivery ID */
  deliveryId: string
  /** New delivery status (if status change event) */
  status?: DeliveryStatus
  /** Current driver/order location (if location update event) */
  location?: { latitude: number; longitude: number }
  /** Raw event data from the provider */
  data: Record<string, unknown>
}

// ---- Provider interface ----------------------------------------------------

/**
 * Pluggable last-mile delivery provider interface.
 *
 * Each delivery service (Armada, Parcel, etc.) implements this interface.
 * The core lifecycle is: `estimate → create → get → cancel`.
 *
 * @example
 * ```ts
 * const armada = new ArmadaDeliveryProvider({ accessToken: 'arap_...' })
 * const estimate = await armada.estimate({
 *   origin: { branchId: '682473e10313f6003826e5d7' },
 *   destination: {
 *     contactName: 'Nadeen',
 *     contactPhone: '+96512345678',
 *     firstLine: 'Salmiya, Block 7',
 *     latitude: 29.3375,
 *     longitude: 48.0657,
 *   },
 * })
 * const delivery = await armada.createDelivery({
 *   origin: { branchId: '682473e10313f6003826e5d7' },
 *   destination: { ...estimate },
 *   orderId: 'order_abc123',
 * })
 * ```
 */
export interface DeliveryProvider {
  /** Unique provider identifier (e.g., 'armada', 'parcel') */
  readonly id: string
  /** Human-readable provider name (e.g., 'Armada Delivery', 'Parcel') */
  readonly name: string

  /** Estimate delivery fee and time without creating a delivery */
  estimate(input: EstimateDeliveryInput): Promise<DeliveryEstimate>

  /** Create a delivery task/order */
  createDelivery(input: CreateDeliveryInput): Promise<Delivery>

  /** Get current delivery status and details */
  getDelivery(deliveryId: string): Promise<Delivery>

  /** Cancel a pending or in-progress delivery */
  cancelDelivery(deliveryId: string): Promise<Delivery>

  /** Verify webhook and parse event — Armada uses HMAC headers, Parcel uses WebhookSecret in payload */
  verifyWebhook?(payload: string | Uint8Array, signature: string): Promise<DeliveryWebhookEvent>
}
