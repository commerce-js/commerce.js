import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ArmadaDeliveryProvider } from '../armada-provider.js'
import type { ArmadaProviderConfig, ArmadaRawOrder, ArmadaRawEstimate } from '../types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

function createProvider(fetchFn: ReturnType<typeof mockFetch>): ArmadaDeliveryProvider {
  return new ArmadaDeliveryProvider({
    accessToken: 'test_token',
    fetchFn: fetchFn as unknown as typeof fetch,
  })
}

const SAMPLE_ORDER: ArmadaRawOrder = {
  code: 'DEL-001',
  status: 'pending',
  delivery_fee: 3.5,
  currency: 'KWD',
  origin: {
    full_address: 'Store A, Kuwait City',
    latitude: 29.3759,
    longitude: 47.9774,
    contact_name: 'Store Manager',
    contact_number: '+96500000000',
  },
  destination: {
    full_address: 'Salmiya, Block 7',
    latitude: 29.3375,
    longitude: 48.0657,
    contact_name: 'Ahmed',
    contact_number: '+96512345678',
    special_instructions: 'Ring the bell',
  },
  tracking_url: 'https://track.armadadelivery.com/DEL-001',
  reference: 'order_abc123',
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:05:00Z',
}

const SAMPLE_ESTIMATE: ArmadaRawEstimate = {
  delivery_fee: 2.0,
  currency: 'KWD',
  estimated_pickup_at: '2025-01-15T10:15:00Z',
  estimated_delivery_at: '2025-01-15T10:45:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ArmadaDeliveryProvider', () => {
  // ---- Metadata ----------------------------------------------------------

  describe('metadata', () => {
    it('has correct id and name', () => {
      const provider = createProvider(mockFetch({}))
      expect(provider.id).toBe('armada')
      expect(provider.name).toBe('Armada Delivery')
    })
  })

  // ---- estimate ----------------------------------------------------------

  describe('estimate()', () => {
    it('estimates delivery with branch origin', async () => {
      const fetch = mockFetch(SAMPLE_ESTIMATE)
      const provider = createProvider(fetch)

      const result = await provider.estimate({
        origin: { branchId: 'branch_123' },
        destination: {
          contactName: 'Ahmed',
          contactPhone: '+96512345678',
          firstLine: 'Salmiya',
          latitude: 29.3375,
          longitude: 48.0657,
        },
      })

      expect(result.fee).toBe(2.0)
      expect(result.currency).toBe('KWD')
      expect(result.estimatedDuration).toBe(30) // 30 minutes
      expect(fetch).toHaveBeenCalledWith(
        'https://api.armadadelivery.com/v1/deliveries/estimate/static',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"origin_format":"branch"'),
        }),
      )
    })

    it('estimates delivery with location origin', async () => {
      const fetch = mockFetch(SAMPLE_ESTIMATE)
      const provider = createProvider(fetch)

      const result = await provider.estimate({
        origin: {
          contactName: 'Store',
          contactPhone: '+96500000000',
          firstLine: 'Kuwait City',
          latitude: 29.3759,
          longitude: 47.9774,
        },
        destination: {
          contactName: 'Ahmed',
          contactPhone: '+96512345678',
          firstLine: 'Salmiya',
          latitude: 29.3375,
          longitude: 48.0657,
        },
      })

      expect(result.fee).toBe(2.0)
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"origin_format":"location"'),
        }),
      )
    })
  })

  // ---- createDelivery ----------------------------------------------------

  describe('createDelivery()', () => {
    it('creates a delivery and normalizes the response', async () => {
      const fetch = mockFetch(SAMPLE_ORDER)
      const provider = createProvider(fetch)

      const result = await provider.createDelivery({
        origin: { branchId: 'branch_123' },
        destination: {
          contactName: 'Ahmed',
          contactPhone: '+96512345678',
          firstLine: 'Salmiya, Block 7',
          latitude: 29.3375,
          longitude: 48.0657,
          instructions: 'Ring the bell',
        },
        orderId: 'order_abc123',
        payment: { amount: 15, type: 'cash' },
      })

      expect(result.id).toBe('DEL-001')
      expect(result.providerId).toBe('armada')
      expect(result.status).toBe('pending')
      expect(result.fee).toBe(3.5)
      expect(result.currency).toBe('KWD')
      expect(result.trackingUrl).toBe('https://track.armadadelivery.com/DEL-001')
      expect(result.origin.contactName).toBe('Store Manager')
      expect(result.destination.contactName).toBe('Ahmed')
      expect(result.destination.instructions).toBe('Ring the bell')
      expect(result.orderId).toBe('order_abc123')

      // Verify request body
      const callBody = JSON.parse(fetch.mock.calls[0][1].body)
      expect(callBody.reference).toBe('order_abc123')
      expect(callBody.payment_type).toBe('cash_on_delivery')
      expect(callBody.payment_amount).toBe(15)
    })
  })

  // ---- getDelivery -------------------------------------------------------

  describe('getDelivery()', () => {
    it('fetches and normalizes a delivery', async () => {
      const order = { ...SAMPLE_ORDER, status: 'en_route' as const, driver: { name: 'Ali', phone: '+96599999999', latitude: 29.34, longitude: 48.01 } }
      const fetch = mockFetch(order)
      const provider = createProvider(fetch)

      const result = await provider.getDelivery('DEL-001')

      expect(result.id).toBe('DEL-001')
      expect(result.status).toBe('in_transit')
      expect(result.driver?.name).toBe('Ali')
      expect(result.driver?.latitude).toBe(29.34)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.armadadelivery.com/v1/deliveries/DEL-001',
        expect.objectContaining({ method: 'GET' }),
      )
    })
  })

  // ---- cancelDelivery ----------------------------------------------------

  describe('cancelDelivery()', () => {
    it('cancels a delivery', async () => {
      const order = { ...SAMPLE_ORDER, status: 'canceled' as const }
      const fetch = mockFetch(order)
      const provider = createProvider(fetch)

      const result = await provider.cancelDelivery('DEL-001')

      expect(result.status).toBe('cancelled')
      expect(fetch).toHaveBeenCalledWith(
        'https://api.armadadelivery.com/v1/deliveries/DEL-001/cancel',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  // ---- verifyWebhook -----------------------------------------------------

  describe('verifyWebhook()', () => {
    it('parses order.updated webhook', async () => {
      const provider = createProvider(mockFetch({}))
      const payload = JSON.stringify({
        code: 'DEL-001',
        status: 'completed',
      })

      const event = await provider.verifyWebhook(payload, 'order.updated')

      expect(event.type).toBe('delivery.updated')
      expect(event.deliveryId).toBe('DEL-001')
      expect(event.status).toBe('delivered')
      expect(event.location).toBeUndefined()
    })

    it('parses order.location.updated webhook with driver location', async () => {
      const provider = createProvider(mockFetch({}))
      const payload = JSON.stringify({
        code: 'DEL-002',
        status: 'en_route',
        driver: { name: 'Ali', latitude: 29.34, longitude: 48.01 },
      })

      const event = await provider.verifyWebhook(payload, 'order.location.updated')

      expect(event.type).toBe('delivery.location')
      expect(event.deliveryId).toBe('DEL-002')
      expect(event.status).toBe('in_transit')
      expect(event.location).toEqual({ latitude: 29.34, longitude: 48.01 })
    })

    it('handles Uint8Array payload', async () => {
      const provider = createProvider(mockFetch({}))
      const payload = new TextEncoder().encode(
        JSON.stringify({ code: 'DEL-003', status: 'dispatched' }),
      )

      const event = await provider.verifyWebhook(payload, 'order.updated')

      expect(event.deliveryId).toBe('DEL-003')
      expect(event.status).toBe('assigned')
    })
  })

  // ---- Error handling ----------------------------------------------------

  describe('error handling', () => {
    it('throws on API error with message', async () => {
      const fetch = mockFetch({ message: 'Invalid access token' }, 401)
      const provider = createProvider(fetch)

      await expect(provider.getDelivery('DEL-001')).rejects.toThrow(
        'Armada API error: Invalid access token',
      )
    })

    it('throws on API error without message', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })
      const provider = new ArmadaDeliveryProvider({
        accessToken: 'test',
        fetchFn: fetch as unknown as typeof fetch,
      })

      await expect(provider.getDelivery('DEL-001')).rejects.toThrow(
        'Armada API error: 500',
      )
    })

    it('throws on network failure', async () => {
      const fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const provider = new ArmadaDeliveryProvider({
        accessToken: 'test',
        fetchFn: fetch as unknown as typeof fetch,
      })

      await expect(provider.getDelivery('DEL-001')).rejects.toThrow('Network error')
    })
  })

  // ---- Status mapping ----------------------------------------------------

  describe('status mapping', () => {
    const cases: Array<[string, string]> = [
      ['pending', 'pending'],
      ['dispatched', 'assigned'],
      ['waiting_pack', 'pickup'],
      ['en_route', 'in_transit'],
      ['completed', 'delivered'],
      ['canceled', 'cancelled'],
      ['failed', 'failed'],
    ]

    it.each(cases)('maps Armada "%s" → Commerce.js "%s"', async (armadaStatus, expectedStatus) => {
      const order = { ...SAMPLE_ORDER, status: armadaStatus }
      const fetch = mockFetch(order)
      const provider = createProvider(fetch)

      const result = await provider.getDelivery('DEL-001')
      expect(result.status).toBe(expectedStatus)
    })
  })
})
