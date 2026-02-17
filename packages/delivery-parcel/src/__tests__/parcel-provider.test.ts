import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ParcelDeliveryProvider } from '../parcel-provider.js'
import type { ParcelProviderConfig, ParcelRawTask, ParcelRawPriceEstimate } from '../types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a mock fetch that returns OAuth token first, then data */
function mockFetchWithAuth(data: unknown, status = 200) {
  const fn = vi.fn()
  // First call = OAuth token
  fn.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        access_token: 'test_token_123',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    text: () => Promise.resolve(''),
  })
  // Second call = API response
  fn.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      Promise.resolve({
        status: 200,
        code: 'RTRIV',
        message: 'Success',
        data,
      }),
    text: () =>
      Promise.resolve(
        JSON.stringify({ status, code: 'ERR', message: 'Error', data }),
      ),
  })
  return fn
}

function createProvider(
  fetchFn: ReturnType<typeof mockFetchWithAuth>,
  extra?: Partial<ParcelProviderConfig>,
): ParcelDeliveryProvider {
  return new ParcelDeliveryProvider({
    clientId: 'test_client',
    clientSecret: 'test_secret',
    region: 'SA-riyadh',
    fetchFn: fetchFn as unknown as typeof fetch,
    ...extra,
  })
}

const SAMPLE_TASK: ParcelRawTask = {
  _id: 'task_001',
  taskRelation: 'TR-001',
  status: 'Unassigned',
  pickup: {
    name: 'Store Manager',
    phone: '+966500000000',
    formatted_address: 'Olaya St, Riyadh',
    address: { location: { lat: 24.7136, lng: 46.6753 } },
  },
  deliveries: [
    {
      _id: 'del_001',
      status: 'Unassigned',
      address: {
        name: 'Customer',
        phone: '+966512345678',
        formatted_address: 'King Fahd Rd, Riyadh',
        location: { lat: 24.7743, lng: 46.7386 },
      },
      duration: 25,
      distance: 8500,
      notes: 'Leave at reception',
    },
  ],
  taskFees: 15,
  currency: 'SAR',
  trackingUrl: 'https://track.tryparcel.com/TR-001',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:05:00Z',
}

const SAMPLE_ESTIMATE: ParcelRawPriceEstimate = {
  taskFees: 12.5,
  deliveries: [{ pointFees: 12.5, duration: 20, distance: 7000 }],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParcelDeliveryProvider', () => {
  // ---- Metadata ----------------------------------------------------------

  describe('metadata', () => {
    it('has correct id and name', () => {
      const provider = createProvider(mockFetchWithAuth({}))
      expect(provider.id).toBe('parcel')
      expect(provider.name).toBe('Parcel Delivery')
    })
  })

  // ---- OAuth2 token management -------------------------------------------

  describe('OAuth2', () => {
    it('acquires token before API call', async () => {
      const fetch = mockFetchWithAuth(SAMPLE_TASK)
      const provider = createProvider(fetch)

      await provider.getDelivery('TR-001')

      // First call should be OAuth
      expect(fetch.mock.calls[0][0]).toContain('/oauth/token')
      const oauthBody = JSON.parse(fetch.mock.calls[0][1].body)
      expect(oauthBody.grant_type).toBe('client_credentials')
      expect(oauthBody.client_id).toBe('test_client')

      // Second call should be API with Bearer token
      expect(fetch.mock.calls[1][1].headers.Authorization).toBe(
        'Bearer test_token_123',
      )
    })

    it('reuses cached token for subsequent calls', async () => {
      const fetch = vi.fn()
      // OAuth token
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            access_token: 'cached_token',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        text: () => Promise.resolve(''),
      })
      // First API call
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 200, data: SAMPLE_TASK }),
        text: () => Promise.resolve(''),
      })
      // Second API call (no OAuth needed)
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 200, data: SAMPLE_TASK }),
        text: () => Promise.resolve(''),
      })

      const provider = new ParcelDeliveryProvider({
        clientId: 'test',
        clientSecret: 'test',
        fetchFn: fetch as unknown as typeof fetch,
      })

      await provider.getDelivery('TR-001')
      await provider.getDelivery('TR-001')

      // OAuth should only be called once
      expect(fetch).toHaveBeenCalledTimes(3) // 1 oauth + 2 api
    })
  })

  // ---- estimate ----------------------------------------------------------

  describe('estimate()', () => {
    it('estimates delivery price', async () => {
      const fetch = mockFetchWithAuth(SAMPLE_ESTIMATE)
      const provider = createProvider(fetch)

      const result = await provider.estimate({
        origin: {
          contactName: 'Store',
          contactPhone: '+966500000000',
          firstLine: 'Olaya St',
          latitude: 24.7136,
          longitude: 46.6753,
        },
        destination: {
          contactName: 'Customer',
          contactPhone: '+966512345678',
          firstLine: 'King Fahd Rd',
          latitude: 24.7743,
          longitude: 46.7386,
        },
      })

      expect(result.fee).toBe(12.5)
      expect(result.currency).toBe('SAR')
      expect(result.estimatedDuration).toBe(20)
      expect(result.estimatedDistance).toBe(7000)
    })
  })

  // ---- createDelivery ----------------------------------------------------

  describe('createDelivery()', () => {
    it('creates a delivery and normalizes the response', async () => {
      const fetch = mockFetchWithAuth(SAMPLE_TASK)
      const provider = createProvider(fetch)

      const result = await provider.createDelivery({
        origin: {
          contactName: 'Store Manager',
          contactPhone: '+966500000000',
          firstLine: 'Olaya St, Riyadh',
          latitude: 24.7136,
          longitude: 46.6753,
        },
        destination: {
          contactName: 'Customer',
          contactPhone: '+966512345678',
          firstLine: 'King Fahd Rd, Riyadh',
          latitude: 24.7743,
          longitude: 46.7386,
          instructions: 'Leave at reception',
        },
        orderId: 'order_123',
        payment: { amount: 50, type: 'cash' },
      })

      expect(result.id).toBe('TR-001')
      expect(result.providerId).toBe('parcel')
      expect(result.status).toBe('pending')
      expect(result.fee).toBe(15)
      expect(result.currency).toBe('SAR')
      expect(result.origin.contactName).toBe('Store Manager')
      expect(result.destination.contactName).toBe('Customer')
      expect(result.destination.instructions).toBe('Leave at reception')
      expect(result.trackingUrl).toBe('https://track.tryparcel.com/TR-001')

      // Verify API call
      const apiBody = JSON.parse(fetch.mock.calls[1][1].body)
      expect(apiBody.reference).toBe('order_123')
      expect(apiBody.paymentType).toBe('cod')
    })
  })

  // ---- getDelivery -------------------------------------------------------

  describe('getDelivery()', () => {
    it('fetches and normalizes a delivery', async () => {
      const task = {
        ...SAMPLE_TASK,
        status: 'In Progress' as const,
        driver: { name: 'Mohammed', phone: '+966599999999', location: { lat: 24.72, lng: 46.68 } },
      }
      const fetch = mockFetchWithAuth(task)
      const provider = createProvider(fetch)

      const result = await provider.getDelivery('TR-001')

      expect(result.id).toBe('TR-001')
      expect(result.status).toBe('in_transit')
      expect(result.driver?.name).toBe('Mohammed')
      expect(result.driver?.latitude).toBe(24.72)
      expect(fetch.mock.calls[1][0]).toContain('/v4/task/TR-001')
    })
  })

  // ---- cancelDelivery ----------------------------------------------------

  describe('cancelDelivery()', () => {
    it('cancels and then fetches the updated delivery', async () => {
      const fetch = vi.fn()
      // OAuth
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            access_token: 'token',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        text: () => Promise.resolve(''),
      })
      // Cancel API call
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 200, data: {} }),
        text: () => Promise.resolve(''),
      })
      // Get updated task
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            status: 200,
            data: { ...SAMPLE_TASK, status: 'Canceled' },
          }),
        text: () => Promise.resolve(''),
      })

      const provider = new ParcelDeliveryProvider({
        clientId: 'test',
        clientSecret: 'test',
        fetchFn: fetch as unknown as typeof fetch,
      })

      const result = await provider.cancelDelivery('TR-001')

      expect(result.status).toBe('cancelled')
      expect(fetch.mock.calls[1][0]).toContain('/v4/task/cancel/TR-001')
      expect(fetch.mock.calls[1][1].method).toBe('PUT')
    })
  })

  // ---- verifyWebhook -----------------------------------------------------

  describe('verifyWebhook()', () => {
    it('parses taskUpdate webhook with valid secret', async () => {
      const provider = createProvider(mockFetchWithAuth({}), {
        webhookSecret: 'my_secret',
      })
      const payload = JSON.stringify({
        hookType: 'taskUpdate',
        WebhookSecret: 'my_secret',
        data: {
          taskRelation: 'TR-001',
          status: 'Completed',
        },
      })

      const event = await provider.verifyWebhook(payload, '')

      expect(event.type).toBe('delivery.updated')
      expect(event.deliveryId).toBe('TR-001')
      expect(event.status).toBe('delivered')
    })

    it('rejects webhook with invalid secret', async () => {
      const provider = createProvider(mockFetchWithAuth({}), {
        webhookSecret: 'my_secret',
      })
      const payload = JSON.stringify({
        hookType: 'taskUpdate',
        WebhookSecret: 'wrong_secret',
        data: { taskRelation: 'TR-001', status: 'Completed' },
      })

      await expect(provider.verifyWebhook(payload, '')).rejects.toThrow(
        'Parcel webhook verification failed',
      )
    })

    it('parses driver location webhook', async () => {
      const provider = createProvider(mockFetchWithAuth({}))
      const payload = JSON.stringify({
        hookType: 'driverLocation',
        WebhookSecret: '',
        data: {
          taskRelation: 'TR-002',
          status: 'In Progress',
          driver: { name: 'Ali', location: { lat: 24.73, lng: 46.69 } },
        },
      })

      const event = await provider.verifyWebhook(payload, '')

      expect(event.type).toBe('delivery.location')
      expect(event.location).toEqual({ latitude: 24.73, longitude: 46.69 })
    })

    it('handles Uint8Array payload', async () => {
      const provider = createProvider(mockFetchWithAuth({}))
      const payload = new TextEncoder().encode(
        JSON.stringify({
          hookType: 'taskUpdate',
          WebhookSecret: '',
          data: { taskRelation: 'TR-003', status: 'Assigned' },
        }),
      )

      const event = await provider.verifyWebhook(payload, '')

      expect(event.deliveryId).toBe('TR-003')
      expect(event.status).toBe('assigned')
    })
  })

  // ---- Error handling ----------------------------------------------------

  describe('error handling', () => {
    it('throws on OAuth failure', async () => {
      const fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Invalid credentials'),
      })
      const provider = new ParcelDeliveryProvider({
        clientId: 'bad',
        clientSecret: 'bad',
        fetchFn: fetch as unknown as typeof fetch,
      })

      await expect(provider.getDelivery('TR-001')).rejects.toThrow(
        'Parcel OAuth error: 401',
      )
    })

    it('throws on API error with message', async () => {
      const fetch = vi.fn()
      // OAuth token
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            access_token: 'test_token_123',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        text: () => Promise.resolve(''),
      })
      // API error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        text: () =>
          Promise.resolve(
            JSON.stringify({ message: 'Insufficient balance' }),
          ),
      })
      const provider = new ParcelDeliveryProvider({
        clientId: 'test_client',
        clientSecret: 'test_secret',
        fetchFn: fetch as unknown as typeof fetch,
      })

      await expect(provider.getDelivery('TR-001')).rejects.toThrow(
        'Parcel API error: Insufficient balance',
      )
    })

    it('throws on network failure', async () => {
      const fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const provider = new ParcelDeliveryProvider({
        clientId: 'test',
        clientSecret: 'test',
        fetchFn: fetch as unknown as typeof fetch,
      })

      await expect(provider.getDelivery('TR-001')).rejects.toThrow(
        'Network error',
      )
    })
  })

  // ---- Status mapping ----------------------------------------------------

  describe('status mapping', () => {
    const cases: Array<[string, string]> = [
      ['Unassigned', 'pending'],
      ['Acquiring Location', 'pending'],
      ['Assigned', 'assigned'],
      ['In Progress', 'in_transit'],
      ['Completed', 'delivered'],
      ['Successful', 'delivered'],
      ['Canceled', 'cancelled'],
      ['Location Inquiry Expired', 'failed'],
    ]

    it.each(cases)('maps Parcel "%s" → Commerce.js "%s"', async (parcelStatus, expectedStatus) => {
      const task = { ...SAMPLE_TASK, status: parcelStatus }
      const fetch = mockFetchWithAuth(task)
      const provider = createProvider(fetch)

      const result = await provider.getDelivery('TR-001')
      expect(result.status).toBe(expectedStatus)
    })
  })

  // ---- Region header -----------------------------------------------------

  describe('region header', () => {
    it('sends region header with API requests', async () => {
      const fetch = mockFetchWithAuth(SAMPLE_TASK)
      const provider = createProvider(fetch, { region: 'BH-manama' })

      await provider.getDelivery('TR-001')

      // Second call (API, not OAuth) should have region header
      expect(fetch.mock.calls[1][1].headers.region).toBe('BH-manama')
    })
  })
})
