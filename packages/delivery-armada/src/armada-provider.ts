// ---------------------------------------------------------------------------
// ArmadaDeliveryProvider — Armada last-mile delivery (location-based, COD)
// ---------------------------------------------------------------------------
//
// Wraps the Armada Delivery REST API and normalizes responses into
// Commerce.js's unified DeliveryProvider interface.
//
// API docs: https://docs.armadadelivery.com
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
  ArmadaProviderConfig,
  ArmadaRawEstimate,
  ArmadaRawOrder,
  ArmadaOrderStatus,
  ArmadaWebhookPayload,
} from './types.js'

const ARMADA_API_BASE = 'https://api.armadadelivery.com/v1'

// ---- Status mapping --------------------------------------------------------

/** Map Armada order status → DeliveryStatus */
function mapArmadaStatus(status: ArmadaOrderStatus): DeliveryStatus {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'dispatched':
      return 'assigned'
    case 'waiting_pack':
      return 'pickup'
    case 'en_route':
      return 'in_transit'
    case 'completed':
      return 'delivered'
    case 'canceled':
      return 'cancelled'
    case 'failed':
      return 'failed'
    default:
      return 'pending'
  }
}

/** Map webhook topic to event type */
function mapWebhookTopic(topic: string): string {
  switch (topic) {
    case 'order.updated':
      return 'delivery.updated'
    case 'order.location.updated':
      return 'delivery.location'
    default:
      return `delivery.${topic}`
  }
}

// ---- Helpers ---------------------------------------------------------------

/** Map an ArmadaRawOrder to a normalized Delivery */
function rawOrderToDelivery(raw: ArmadaRawOrder, providerId: string): Delivery {
  return {
    id: raw.code,
    providerId,
    status: mapArmadaStatus(raw.status),
    origin: {
      contactName: raw.origin.contact_name ?? '',
      contactPhone: raw.origin.contact_number ?? '',
      firstLine: raw.origin.full_address ?? '',
      latitude: raw.origin.latitude,
      longitude: raw.origin.longitude,
    },
    destination: {
      contactName: raw.destination.contact_name ?? '',
      contactPhone: raw.destination.contact_number ?? '',
      firstLine: raw.destination.full_address ?? '',
      latitude: raw.destination.latitude,
      longitude: raw.destination.longitude,
      instructions: raw.destination.special_instructions,
    },
    fee: raw.delivery_fee,
    currency: raw.currency,
    trackingUrl: raw.tracking_url,
    driver: raw.driver
      ? {
          name: raw.driver.name ?? '',
          phone: raw.driver.phone ?? '',
          latitude: raw.driver.latitude,
          longitude: raw.driver.longitude,
        }
      : undefined,
    orderId: raw.reference,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    providerData: { raw },
  }
}

// ---- Provider class --------------------------------------------------------

/**
 * Armada Delivery provider — last-mile delivery with real-time tracking.
 *
 * @example
 * ```ts
 * const armada = new ArmadaDeliveryProvider({ accessToken: 'arap_...' })
 *
 * const estimate = await armada.estimate({
 *   origin: { branchId: '682473e10313f6003826e5d7' },
 *   destination: {
 *     contactName: 'Ahmed',
 *     contactPhone: '+96512345678',
 *     firstLine: 'Salmiya, Block 7',
 *     latitude: 29.3375,
 *     longitude: 48.0657,
 *   },
 * })
 *
 * const delivery = await armada.createDelivery({
 *   origin: { branchId: '682473e10313f6003826e5d7' },
 *   destination: { ... },
 *   orderId: 'order_abc123',
 * })
 * ```
 */
export class ArmadaDeliveryProvider implements DeliveryProvider {
  readonly id = 'armada'
  readonly name = 'Armada Delivery'

  private baseUrl: string
  private accessToken: string
  private fetchFn: typeof fetch

  constructor(private config: ArmadaProviderConfig) {
    this.baseUrl = config.baseUrl ?? ARMADA_API_BASE
    this.accessToken = config.accessToken
    this.fetchFn = config.fetchFn ?? globalThis.fetch
  }

  // ---- estimate ------------------------------------------------------------

  async estimate(input: EstimateDeliveryInput): Promise<DeliveryEstimate> {
    // Build origin payload
    let originPayload: Record<string, unknown>
    if ('branchId' in input.origin) {
      originPayload = {
        origin_format: 'branch',
        origin: input.origin.branchId,
      }
    } else {
      originPayload = {
        origin_format: 'location',
        origin: {
          latitude: input.origin.latitude,
          longitude: input.origin.longitude,
        },
      }
    }

    // Build destination payload
    const dest = input.destination
    const destinationPayload = {
      destination_format: 'location',
      destination: {
        latitude: dest.latitude,
        longitude: dest.longitude,
      },
    }

    const data = await this.request<ArmadaRawEstimate>(
      'POST',
      '/deliveries/estimate/static',
      { ...originPayload, ...destinationPayload },
    )

    // Calculate estimated duration from pickup/delivery times
    let estimatedDuration: number | undefined
    if (data.estimated_pickup_at && data.estimated_delivery_at) {
      const pickup = new Date(data.estimated_pickup_at).getTime()
      const delivery = new Date(data.estimated_delivery_at).getTime()
      estimatedDuration = Math.round((delivery - pickup) / 60_000)
    }

    return {
      fee: data.delivery_fee,
      currency: data.currency,
      estimatedDuration,
      providerData: { raw: data },
    }
  }

  // ---- createDelivery ------------------------------------------------------

  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    // Build origin
    let originPayload: Record<string, unknown>
    if ('branchId' in input.origin) {
      originPayload = {
        origin_format: 'branch',
        origin: input.origin.branchId,
      }
    } else {
      const o = input.origin as DeliveryAddress
      originPayload = {
        origin_format: 'location',
        origin: {
          latitude: o.latitude,
          longitude: o.longitude,
          full_address: o.firstLine,
          contact_name: o.contactName,
          contact_number: o.contactPhone,
        },
      }
    }

    // Build destination
    const d = input.destination
    const body: Record<string, unknown> = {
      ...originPayload,
      destination_format: 'location',
      destination: {
        latitude: d.latitude,
        longitude: d.longitude,
        full_address: d.firstLine,
        contact_name: d.contactName,
        contact_number: d.contactPhone,
        special_instructions: d.instructions,
      },
    }

    if (input.orderId) body.reference = input.orderId
    if (input.payment) {
      body.payment_type = input.payment.type === 'cash' ? 'cash_on_delivery' : 'prepaid'
      body.payment_amount = input.payment.amount
    }
    if (input.scheduledAt) body.scheduled_at = input.scheduledAt
    if (input.items) body.items = input.items
    if (input.metadata) body.metadata = input.metadata

    const raw = await this.request<ArmadaRawOrder>('POST', '/deliveries', body)
    return rawOrderToDelivery(raw, this.id)
  }

  // ---- getDelivery ---------------------------------------------------------

  async getDelivery(deliveryId: string): Promise<Delivery> {
    const raw = await this.request<ArmadaRawOrder>('GET', `/deliveries/${deliveryId}`)
    return rawOrderToDelivery(raw, this.id)
  }

  // ---- cancelDelivery ------------------------------------------------------

  async cancelDelivery(deliveryId: string): Promise<Delivery> {
    const raw = await this.request<ArmadaRawOrder>(
      'POST',
      `/deliveries/${deliveryId}/cancel`,
    )
    return rawOrderToDelivery(raw, this.id)
  }

  // ---- verifyWebhook -------------------------------------------------------

  async verifyWebhook(
    payload: string | Uint8Array,
    signature: string,
  ): Promise<DeliveryWebhookEvent> {
    // Signature is the x-armada-webhook-topic header value
    const topic = signature
    const body: ArmadaWebhookPayload =
      typeof payload === 'string'
        ? JSON.parse(payload)
        : JSON.parse(new TextDecoder().decode(payload))

    return {
      type: mapWebhookTopic(topic),
      deliveryId: body.code,
      status: mapArmadaStatus(body.status),
      location:
        body.driver?.latitude != null && body.driver?.longitude != null
          ? { latitude: body.driver.latitude, longitude: body.driver.longitude }
          : undefined,
      data: body as unknown as Record<string, unknown>,
    }
  }

  // ---- HTTP helper ---------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await this.fetchFn(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Armada-Access-Token': this.accessToken,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const errorBody = await res.text()
      let message = `Armada API error: ${res.status}`
      try {
        const parsed = JSON.parse(errorBody)
        if (parsed.message) message = `Armada API error: ${parsed.message}`
      } catch {
        // Use default message
      }
      throw new Error(message)
    }

    return res.json() as Promise<T>
  }
}
