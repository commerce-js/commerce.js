// ---------------------------------------------------------------------------
// ParcelDeliveryProvider — Parcel last-mile delivery (OAuth2, multi-region)
// ---------------------------------------------------------------------------
//
// Wraps the Parcel Delivery REST API v4 and normalizes responses into
// Commerce.js's unified DeliveryProvider interface.
//
// API docs: https://api-docs.tryparcel.com
// ---------------------------------------------------------------------------

import type {
  DeliveryProvider,
  DeliveryEstimate,
  EstimateDeliveryInput,
  Delivery,
  CreateDeliveryInput,
  DeliveryStatus,
  DeliveryWebhookEvent,
  DeliveryAddress,
} from '@commercejs/types'

import type {
  ParcelProviderConfig,
  ParcelOAuthResponse,
  ParcelRawTask,
  ParcelRawPriceEstimate,
  ParcelTaskStatus,
  ParcelWebhookPayload,
  ParcelApiResponse,
} from './types.js'

const PARCEL_API_BASE = 'https://api.tryparcel.com/api'

// ---- Status mapping --------------------------------------------------------

/** Map Parcel task status → DeliveryStatus */
function mapParcelStatus(status: ParcelTaskStatus): DeliveryStatus {
  switch (status) {
    case 'Unassigned':
    case 'Acquiring Location':
      return 'pending'
    case 'Assigned':
      return 'assigned'
    case 'In Progress':
      return 'in_transit'
    case 'Completed':
    case 'Successful':
      return 'delivered'
    case 'Canceled':
      return 'cancelled'
    case 'Location Inquiry Expired':
      return 'failed'
    default:
      return 'pending'
  }
}

/** Map webhook hookType to event type */
function mapWebhookType(hookType: string): string {
  switch (hookType) {
    case 'taskUpdate':
      return 'delivery.updated'
    case 'driverLocation':
      return 'delivery.location'
    default:
      return `delivery.${hookType}`
  }
}

// ---- Helpers ---------------------------------------------------------------

/** Map a ParcelRawTask to a normalized Delivery */
function rawTaskToDelivery(raw: ParcelRawTask, providerId: string): Delivery {
  const firstDelivery = raw.deliveries?.[0]

  return {
    id: raw.taskRelation,
    providerId,
    status: mapParcelStatus(raw.status),
    origin: {
      contactName: raw.pickup.name ?? '',
      contactPhone: raw.pickup.phone ?? '',
      firstLine: raw.pickup.formatted_address ?? '',
      latitude: raw.pickup.address?.location?.lat,
      longitude: raw.pickup.address?.location?.lng,
    },
    destination: firstDelivery
      ? {
          contactName: firstDelivery.address.name ?? '',
          contactPhone: firstDelivery.address.phone ?? '',
          firstLine: firstDelivery.address.formatted_address ?? '',
          latitude: firstDelivery.address.location?.lat,
          longitude: firstDelivery.address.location?.lng,
          instructions: firstDelivery.notes,
        }
      : {
          contactName: '',
          contactPhone: '',
          firstLine: '',
        },
    fee: raw.taskFees ?? 0,
    currency: raw.currency ?? 'SAR',
    trackingUrl: raw.trackingUrl,
    driver: raw.driver
      ? {
          name: raw.driver.name ?? '',
          phone: raw.driver.phone ?? '',
          latitude: raw.driver.location?.lat,
          longitude: raw.driver.location?.lng,
        }
      : undefined,
    estimatedDuration: firstDelivery?.duration,
    estimatedDistance: firstDelivery?.distance,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    providerData: { raw },
  }
}

// ---- Provider class --------------------------------------------------------

/**
 * Parcel Delivery provider — multi-region last-mile delivery with OAuth2.
 *
 * @example
 * ```ts
 * const parcel = new ParcelDeliveryProvider({
 *   clientId: process.env.PARCEL_CLIENT_ID!,
 *   clientSecret: process.env.PARCEL_CLIENT_SECRET!,
 *   region: 'SA-riyadh',
 * })
 *
 * const estimate = await parcel.estimate({
 *   origin: {
 *     contactName: 'Store',
 *     contactPhone: '+966500000000',
 *     firstLine: 'Olaya St, Riyadh',
 *     latitude: 24.7136,
 *     longitude: 46.6753,
 *   },
 *   destination: {
 *     contactName: 'Customer',
 *     contactPhone: '+966512345678',
 *     firstLine: 'King Fahd Rd, Riyadh',
 *     latitude: 24.7743,
 *     longitude: 46.7386,
 *   },
 * })
 * ```
 */
export class ParcelDeliveryProvider implements DeliveryProvider {
  readonly id = 'parcel'
  readonly name = 'Parcel Delivery'

  private baseUrl: string
  private fetchFn: typeof fetch
  private token?: string
  private tokenExpiresAt = 0

  constructor(private config: ParcelProviderConfig) {
    this.baseUrl = config.baseUrl ?? PARCEL_API_BASE
    this.fetchFn = config.fetchFn ?? globalThis.fetch
  }

  // ---- estimate ------------------------------------------------------------

  async estimate(input: EstimateDeliveryInput): Promise<DeliveryEstimate> {
    const origin = 'branchId' in input.origin ? input.origin : input.origin as DeliveryAddress
    const dest = input.destination

    // Build price estimation body
    const body: Record<string, unknown> = {
      pickup: {
        address: {
          location: {
            lat: 'branchId' in input.origin ? 0 : (origin as DeliveryAddress).latitude,
            lng: 'branchId' in input.origin ? 0 : (origin as DeliveryAddress).longitude,
          },
        },
      },
      deliveries: [
        {
          address: {
            location: {
              lat: dest.latitude,
              lng: dest.longitude,
            },
          },
        },
      ],
    }

    const data = await this.request<ParcelRawPriceEstimate>('POST', '/v4/task/price', body)

    const firstDelivery = data.deliveries?.[0]
    return {
      fee: data.taskFees,
      currency: 'SAR', // Parcel operates in SAR
      estimatedDuration: firstDelivery?.duration,
      estimatedDistance: firstDelivery?.distance,
      providerData: { raw: data },
    }
  }

  // ---- createDelivery ------------------------------------------------------

  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    // Build origin
    let pickup: Record<string, unknown>
    if ('branchId' in input.origin) {
      pickup = { branchId: input.origin.branchId }
    } else {
      const o = input.origin as DeliveryAddress
      pickup = {
        name: o.contactName,
        phone: o.contactPhone,
        formatted_address: o.firstLine,
        address: {
          location: { lat: o.latitude, lng: o.longitude },
        },
      }
    }

    // Build destination
    const d = input.destination
    const delivery: Record<string, unknown> = {
      name: d.contactName,
      phone: d.contactPhone,
      formatted_address: d.firstLine,
      address: {
        location: { lat: d.latitude, lng: d.longitude },
      },
      notes: d.instructions,
    }

    const body: Record<string, unknown> = {
      pickup,
      deliveries: [delivery],
    }

    if (input.orderId) body.reference = input.orderId
    if (input.payment) {
      body.paymentType = input.payment.type === 'cash' ? 'cod' : 'prepaid'
      body.paymentAmount = input.payment.amount
    }
    if (input.scheduledAt) body.scheduledAt = input.scheduledAt
    if (input.metadata) body.metadata = input.metadata

    const raw = await this.request<ParcelRawTask>('POST', '/v4/task', body)
    return rawTaskToDelivery(raw, this.id)
  }

  // ---- getDelivery ---------------------------------------------------------

  async getDelivery(deliveryId: string): Promise<Delivery> {
    const raw = await this.request<ParcelRawTask>('GET', `/v4/task/${deliveryId}`)
    return rawTaskToDelivery(raw, this.id)
  }

  // ---- cancelDelivery ------------------------------------------------------

  async cancelDelivery(deliveryId: string): Promise<Delivery> {
    await this.request<unknown>('PUT', `/v4/task/cancel/${deliveryId}`)
    // Fetch updated task to return full delivery
    return this.getDelivery(deliveryId)
  }

  // ---- verifyWebhook -------------------------------------------------------

  async verifyWebhook(
    payload: string | Uint8Array,
    _signature: string,
  ): Promise<DeliveryWebhookEvent> {
    const body: ParcelWebhookPayload =
      typeof payload === 'string'
        ? JSON.parse(payload)
        : JSON.parse(new TextDecoder().decode(payload))

    // Verify webhook secret
    if (this.config.webhookSecret && body.WebhookSecret !== this.config.webhookSecret) {
      throw new Error('Parcel webhook verification failed: invalid WebhookSecret')
    }

    return {
      type: mapWebhookType(body.hookType),
      deliveryId: body.data.taskRelation,
      status: mapParcelStatus(body.data.status),
      location:
        body.data.driver?.location?.lat != null && body.data.driver?.location?.lng != null
          ? { latitude: body.data.driver.location.lat, longitude: body.data.driver.location.lng }
          : undefined,
      data: body as unknown as Record<string, unknown>,
    }
  }

  // ---- OAuth2 token management ---------------------------------------------

  private async authenticate(): Promise<string> {
    const now = Date.now()
    if (this.token && now < this.tokenExpiresAt) return this.token

    const url = `${this.baseUrl}/oauth/token`
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Parcel OAuth error: ${res.status} — ${errorBody}`)
    }

    const data = (await res.json()) as ParcelOAuthResponse
    this.token = data.access_token
    // Refresh 60s before actual expiry
    this.tokenExpiresAt = now + (data.expires_in - 60) * 1000
    return this.token
  }

  // ---- HTTP helper ---------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.authenticate()
    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    if (this.config.region) {
      headers['region'] = this.config.region
    }

    const res = await this.fetchFn(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      // If 401, clear token and retry once
      if (res.status === 401 && this.token) {
        this.token = undefined
        this.tokenExpiresAt = 0
        return this.request(method, path, body)
      }

      const errorBody = await res.text()
      let message = `Parcel API error: ${res.status}`
      try {
        const parsed = JSON.parse(errorBody)
        if (parsed.message) message = `Parcel API error: ${parsed.message}`
      } catch {
        // Use default message
      }
      throw new Error(message)
    }

    const json = (await res.json()) as ParcelApiResponse<T>
    // Parcel wraps responses in { status, data, ... }
    return json.data !== undefined ? json.data : (json as unknown as T)
  }
}
