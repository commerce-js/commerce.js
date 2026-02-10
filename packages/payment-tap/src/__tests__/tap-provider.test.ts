import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TapPaymentProvider } from '../tap-provider.js'
import type { TapRawCharge } from '../types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTapCharge(overrides: Partial<TapRawCharge> = {}): TapRawCharge {
  return {
    id: 'chg_test_abc123',
    status: 'INITIATED',
    amount: 99.99,
    currency: 'SAR',
    threeDSecure: true,
    source: { id: 'src_card', type: 'CARD_NOT_PRESENT' },
    transaction: {
      url: 'https://tap.company/3ds/abc123',
      created: '2026-02-09T12:00:00Z',
    },
    redirect: { url: 'https://store.com/checkout/confirm' },
    created: '2026-02-09T12:00:00Z',
    ...overrides,
  }
}

function mockFetchResponse(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TapPaymentProvider', () => {
  let provider: TapPaymentProvider

  beforeEach(() => {
    provider = new TapPaymentProvider({
      secretKey: 'sk_test_xxx',
      webhookSecret: 'whsec_test',
    })
  })

  // ---- Constructor -------------------------------------------------------

  describe('constructor', () => {
    it('sets id and name', () => {
      expect(provider.id).toBe('tap')
      expect(provider.name).toBe('Tap Payments')
    })
  })

  // ---- createSession ----------------------------------------------------

  describe('createSession', () => {
    it('creates a charge and returns a PaymentSession with redirectUrl', async () => {
      const charge = makeTapCharge()
      globalThis.fetch = mockFetchResponse(charge)

      const session = await provider.createSession({
        amount: 99.99,
        currency: 'SAR',
        sourceToken: 'tok_test_123',
        returnUrl: 'https://store.com/checkout/confirm',
      })

      expect(session.id).toBe('chg_test_abc123')
      expect(session.providerId).toBe('tap')
      expect(session.status).toBe('pending')
      expect(session.amount).toBe(99.99)
      expect(session.currency).toBe('SAR')
      expect(session.redirectUrl).toBe('https://tap.company/3ds/abc123')

      // Verify correct API call
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.tap.company/v2/charges',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk_test_xxx',
          }),
        }),
      )
    })

    it('passes orderId as reference.order', async () => {
      const charge = makeTapCharge()
      globalThis.fetch = mockFetchResponse(charge)

      await provider.createSession({
        amount: 50,
        currency: 'SAR',
        orderId: 'order-123',
        returnUrl: 'https://store.com/confirm',
      })

      const callBody = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
      expect(callBody.reference).toEqual({ order: 'order-123' })
    })

    it('uses src_all when no sourceToken is provided', async () => {
      const charge = makeTapCharge()
      globalThis.fetch = mockFetchResponse(charge)

      await provider.createSession({
        amount: 10,
        currency: 'SAR',
        returnUrl: 'https://store.com/confirm',
      })

      const callBody = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
      expect(callBody.source).toEqual({ id: 'src_all' })
    })

    it('throws on Tap API error', async () => {
      globalThis.fetch = mockFetchResponse({ error: 'invalid' }, 400)

      await expect(
        provider.createSession({ amount: 10, currency: 'SAR' }),
      ).rejects.toThrow('Tap API error (400)')
    })
  })

  // ---- confirmSession ---------------------------------------------------

  describe('confirmSession', () => {
    it('re-fetches charge to get final status after 3DS', async () => {
      const captured = makeTapCharge({ status: 'CAPTURED' })
      globalThis.fetch = mockFetchResponse(captured)

      const session = await provider.confirmSession('chg_test_abc123')

      expect(session.status).toBe('captured')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.tap.company/v2/charges/chg_test_abc123',
        expect.objectContaining({ method: 'GET' }),
      )
    })
  })

  // ---- getSession -------------------------------------------------------

  describe('getSession', () => {
    it('fetches charge by ID', async () => {
      const charge = makeTapCharge({ status: 'IN_PROGRESS' })
      globalThis.fetch = mockFetchResponse(charge)

      const session = await provider.getSession('chg_test_abc123')

      expect(session.status).toBe('processing')
      expect(session.id).toBe('chg_test_abc123')
    })
  })

  // ---- refund -----------------------------------------------------------

  describe('refund', () => {
    it('creates a refund and returns updated session', async () => {
      const fetchMock = vi.fn()
        // First call: getSession to get current amount/currency
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve(makeTapCharge({ status: 'CAPTURED' })),
          text: () => Promise.resolve(''),
        })
        // Second call: POST /refunds
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ id: 'ref_123', status: 'REFUNDED' }),
          text: () => Promise.resolve(''),
        })
        // Third call: getSession to get updated status
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve(makeTapCharge({ status: 'REFUNDED' })),
          text: () => Promise.resolve(''),
        })

      globalThis.fetch = fetchMock

      const session = await provider.refund({
        sessionId: 'chg_test_abc123',
        reason: 'requested_by_customer',
      })

      expect(session.status).toBe('refunded')
      expect(fetchMock).toHaveBeenCalledTimes(3)

      // Verify refund POST body
      const refundCall = fetchMock.mock.calls[1]
      expect(refundCall[0]).toBe('https://api.tap.company/v2/refunds')
      const refundBody = JSON.parse(refundCall[1].body)
      expect(refundBody.charge_id).toBe('chg_test_abc123')
      expect(refundBody.amount).toBe(99.99) // full refund
    })

    it('supports partial refund with explicit amount', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve(makeTapCharge({ status: 'CAPTURED' })),
          text: () => Promise.resolve(''),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ id: 'ref_456', status: 'REFUNDED' }),
          text: () => Promise.resolve(''),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve(makeTapCharge({ status: 'CAPTURED' })),
          text: () => Promise.resolve(''),
        })

      globalThis.fetch = fetchMock

      await provider.refund({
        sessionId: 'chg_test_abc123',
        amount: 25.00,
      })

      const refundBody = JSON.parse(fetchMock.mock.calls[1][1].body)
      expect(refundBody.amount).toBe(25.00)
    })
  })

  // ---- Status mapping ---------------------------------------------------

  describe('status mapping', () => {
    const cases: Array<[string, string]> = [
      ['INITIATED', 'pending'],
      ['IN_PROGRESS', 'processing'],
      ['CAPTURED', 'captured'],
      ['FAILED', 'failed'],
      ['DECLINED', 'failed'],
      ['RESTRICTED', 'failed'],
      ['VOID', 'cancelled'],
      ['CANCELLED', 'cancelled'],
      ['TIMEDOUT', 'cancelled'],
      ['ABANDONED', 'cancelled'],
      ['REFUNDED', 'refunded'],
    ]

    it.each(cases)('maps Tap "%s" → "%s"', async (tapStatus, expected) => {
      const charge = makeTapCharge({ status: tapStatus as TapRawCharge['status'] })
      globalThis.fetch = mockFetchResponse(charge)

      const session = await provider.getSession('chg_test_abc123')
      expect(session.status).toBe(expected)
    })
  })

  // ---- cancelSession ----------------------------------------------------

  describe('cancelSession', () => {
    it('returns current session state', async () => {
      const charge = makeTapCharge({ status: 'CANCELLED' })
      globalThis.fetch = mockFetchResponse(charge)

      const session = await provider.cancelSession!('chg_test_abc123')
      expect(session.status).toBe('cancelled')
    })
  })

  // ---- verifyWebhook ----------------------------------------------------

  describe('verifyWebhook', () => {
    it('throws on invalid hashstring', async () => {
      const payload = JSON.stringify({
        id: 'chg_test_abc123',
        amount: 99.99,
        currency: 'SAR',
        status: 'CAPTURED',
        reference: { gateway: 'gw_ref', payment: 'pay_ref' },
        transaction: { created: '2026-02-09T12:00:00Z' },
      })

      await expect(
        provider.verifyWebhook!(payload, 'invalid_sig'),
      ).rejects.toThrow('invalid webhook hashstring')
    })

    it('returns parsed event on valid hashstring', async () => {
      const event = {
        id: 'chg_test_abc123',
        amount: 99.99,
        currency: 'SAR',
        status: 'CAPTURED',
        reference: { gateway: 'gw_ref', payment: 'pay_ref' },
        transaction: { created: '2026-02-09T12:00:00Z' },
      }
      const payload = JSON.stringify(event)

      // Build the hashstring the same way the implementation does
      const toBeHashed =
        `x_id${event.id}` +
        `x_amount${event.amount}` +
        `x_currency${event.currency}` +
        `x_gateway_reference${event.reference.gateway}` +
        `x_payment_reference${event.reference.payment}` +
        `x_status${event.status}` +
        `x_created${event.transaction.created}`

      // HMAC with secretKey (not webhookSecret — matches implementation)
      const encoder = new TextEncoder()
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode('sk_test_xxx'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(toBeHashed))
      const validSignature = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const result = await provider.verifyWebhook!(payload, validSignature)

      expect(result.type).toBe('payment.captured')
      expect(result.sessionId).toBe('chg_test_abc123')
    })
  })
})
