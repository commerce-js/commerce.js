import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckoutSession } from '../checkout-session.js'
import type { PaymentProvider, PaymentSession } from '@commercejs/types'
import type { CheckoutSessionConfig } from '../types.js'

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockPaymentSession(overrides: Partial<PaymentSession> = {}): PaymentSession {
  return {
    id: 'ps_test_123',
    providerId: 'mock',
    status: 'pending',
    amount: 99.99,
    currency: 'SAR',
    providerData: null,
    redirectUrl: 'https://gateway.com/3ds/abc',
    createdAt: '2026-02-09T12:00:00Z',
    ...overrides,
  }
}

function mockProvider(overrides: Partial<PaymentProvider> = {}): PaymentProvider {
  return {
    id: 'mock',
    name: 'Mock Provider',
    createSession: vi.fn().mockResolvedValue(mockPaymentSession()),
    confirmSession: vi.fn().mockResolvedValue(mockPaymentSession({ status: 'captured' })),
    getSession: vi.fn().mockResolvedValue(mockPaymentSession()),
    refund: vi.fn().mockResolvedValue(mockPaymentSession({ status: 'refunded' })),
    ...overrides,
  }
}

function defaultConfig(overrides: Partial<CheckoutSessionConfig> = {}): CheckoutSessionConfig {
  return {
    paymentProvider: mockProvider(),
    currency: 'SAR',
    amount: 99.99,
    returnUrl: 'https://store.com/confirm',
    ...overrides,
  }
}

const address = {
  firstName: 'Ali',
  lastName: 'Ahmed',
  phone: '+966500000000',
  street: '123 King Fahd Rd',
  street2: null,
  city: 'Riyadh',
  state: 'Riyadh',
  country: 'SA',
  postalCode: '12345',
  district: null,
  nationalAddress: null,
  additionalNumber: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CheckoutSession', () => {
  let session: CheckoutSession

  beforeEach(() => {
    session = new CheckoutSession(defaultConfig())
  })

  // ---- Initial state ----------------------------------------------------

  describe('initial state', () => {
    it('starts in idle state', () => {
      expect(session.state).toBe('idle')
    })

    it('has correct config values', () => {
      expect(session.amount).toBe(99.99)
      expect(session.currency).toBe('SAR')
    })

    it('has null for all optional fields', () => {
      expect(session.customerInfo).toBeNull()
      expect(session.shippingAddress).toBeNull()
      expect(session.billingAddress).toBeNull()
      expect(session.shippingMethodId).toBeNull()
      expect(session.paymentSession).toBeNull()
      expect(session.orderId).toBeNull()
      expect(session.error).toBeNull()
    })
  })

  // ---- setCustomerInfo --------------------------------------------------

  describe('setCustomerInfo', () => {
    it('transitions idle → info', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      expect(session.state).toBe('info')
      expect(session.customerInfo?.email).toBe('ali@example.com')
    })

    it('throws if not in idle state', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      expect(() => session.setCustomerInfo({ email: 'x@x.com' }))
        .toThrow('Invalid transition')
    })
  })

  // ---- setShippingAddress -----------------------------------------------

  describe('setShippingAddress', () => {
    it('transitions info → shipping', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      expect(session.state).toBe('shipping')
      expect(session.shippingAddress?.city).toBe('Riyadh')
    })

    it('defaults billing address to shipping address', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      expect(session.billingAddress).toEqual(address)
    })

    it('allows separate billing address', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      const billing = { ...address, city: 'Jeddah' }
      session.setShippingAddress(address, billing)
      expect(session.shippingAddress?.city).toBe('Riyadh')
      expect(session.billingAddress?.city).toBe('Jeddah')
    })

    it('throws if not in info state', () => {
      expect(() => session.setShippingAddress(address))
        .toThrow('Invalid transition')
    })
  })

  // ---- setShippingMethod ------------------------------------------------

  describe('setShippingMethod', () => {
    it('sets method ID in shipping state', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('express')
      expect(session.shippingMethodId).toBe('express')
    })

    it('throws if not in shipping state', () => {
      expect(() => session.setShippingMethod('express'))
        .toThrow('Cannot set shipping method')
    })
  })

  // ---- submitPayment ----------------------------------------------------

  describe('submitPayment', () => {
    beforeEach(() => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
    })

    it('transitions shipping → payment when redirect needed', async () => {
      await session.submitPayment({ sourceToken: 'tok_xxx' })
      expect(session.state).toBe('payment')
      expect(session.paymentSession?.redirectUrl).toBe('https://gateway.com/3ds/abc')
    })

    it('emits paymentAction with redirectUrl', async () => {
      const fn = vi.fn()
      session.on('paymentAction', fn)
      await session.submitPayment({ sourceToken: 'tok_xxx' })
      expect(fn).toHaveBeenCalledWith({ redirectUrl: 'https://gateway.com/3ds/abc' })
    })

    it('goes straight to complete if already captured', async () => {
      const provider = mockProvider({
        createSession: vi.fn().mockResolvedValue(
          mockPaymentSession({ status: 'captured', redirectUrl: null }),
        ),
      })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')

      const completeFn = vi.fn()
      session.on('complete', completeFn)

      await session.submitPayment()
      expect(session.state).toBe('complete')
      expect(completeFn).toHaveBeenCalled()
    })

    it('transitions to failed on provider error', async () => {
      const provider = mockProvider({
        createSession: vi.fn().mockRejectedValue(new Error('Gateway down')),
      })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')

      const errorFn = vi.fn()
      session.on('error', errorFn)

      await expect(session.submitPayment()).rejects.toThrow('Gateway down')
      expect(session.state).toBe('failed')
      expect(session.error?.message).toBe('Gateway down')
      expect(errorFn).toHaveBeenCalled()
    })

    it('throws if not in shipping or failed state', async () => {
      session = new CheckoutSession(defaultConfig())
      await expect(session.submitPayment()).rejects.toThrow('Cannot submit payment')
    })

    it('passes sourceToken and idempotencyKey to provider', async () => {
      const createSession = vi.fn().mockResolvedValue(mockPaymentSession())
      const provider = mockProvider({ createSession })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')

      await session.submitPayment({
        sourceToken: 'tok_abc',
        idempotencyKey: 'idem_123',
      })

      expect(createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceToken: 'tok_abc',
          idempotencyKey: 'idem_123',
        }),
      )
    })
  })

  // ---- confirmPayment ---------------------------------------------------

  describe('confirmPayment', () => {
    beforeEach(async () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
      await session.submitPayment({ sourceToken: 'tok_xxx' })
    })

    it('transitions payment → confirming → complete', async () => {
      const stateChanges: Array<{ from: string; to: string }> = []
      session.on('stateChange', (e) => stateChanges.push(e))

      await session.confirmPayment('ps_test_123')

      expect(session.state).toBe('complete')
      expect(stateChanges).toEqual([
        { from: 'payment', to: 'confirming' },
        { from: 'confirming', to: 'complete' },
      ])
    })

    it('emits complete event', async () => {
      const fn = vi.fn()
      session.on('complete', fn)
      await session.confirmPayment()
      expect(fn).toHaveBeenCalledWith({
        paymentSession: expect.objectContaining({ status: 'captured' }),
      })
    })

    it('transitions to failed if payment failed', async () => {
      const provider = mockProvider({
        createSession: vi.fn().mockResolvedValue(mockPaymentSession()),
        confirmSession: vi.fn().mockResolvedValue(
          mockPaymentSession({ status: 'failed' }),
        ),
      })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
      await session.submitPayment()

      await expect(session.confirmPayment()).rejects.toThrow('Payment failed')
      expect(session.state).toBe('failed')
    })

    it('uses stored session ID if none provided', async () => {
      const confirmSession = vi.fn().mockResolvedValue(
        mockPaymentSession({ status: 'captured' }),
      )
      const provider = mockProvider({ confirmSession })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
      await session.submitPayment()

      await session.confirmPayment()
      expect(confirmSession).toHaveBeenCalledWith('ps_test_123')
    })

    it('throws if not in payment state', async () => {
      session = new CheckoutSession(defaultConfig())
      await expect(session.confirmPayment('x')).rejects.toThrow('Cannot confirm payment')
    })
  })

  // ---- Retry flow -------------------------------------------------------

  describe('retry flow (failed → payment)', () => {
    it('allows re-submitting payment after failure', async () => {
      const createSession = vi.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(mockPaymentSession())

      const provider = mockProvider({ createSession })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')

      // First attempt fails
      await expect(session.submitPayment()).rejects.toThrow('Timeout')
      expect(session.state).toBe('failed')

      // Retry succeeds
      await session.submitPayment({ sourceToken: 'tok_retry' })
      expect(session.state).toBe('payment')
    })
  })

  // ---- State change events ----------------------------------------------

  describe('stateChange events', () => {
    it('fires on every transition through the full flow', async () => {
      const changes: Array<{ from: string; to: string }> = []
      const provider = mockProvider({
        createSession: vi.fn().mockResolvedValue(
          mockPaymentSession({ status: 'captured', redirectUrl: null }),
        ),
      })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.on('stateChange', (e) => changes.push(e))

      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
      await session.submitPayment()

      expect(changes).toEqual([
        { from: 'idle', to: 'info' },
        { from: 'info', to: 'shipping' },
        { from: 'shipping', to: 'confirming' },
        { from: 'confirming', to: 'complete' },
      ])
    })
  })

  // ---- Setters ----------------------------------------------------------

  describe('setAmount', () => {
    it('updates amount before payment', () => {
      session.setAmount(200)
      expect(session.amount).toBe(200)
    })

    it('throws if in complete state', async () => {
      const provider = mockProvider({
        createSession: vi.fn().mockResolvedValue(
          mockPaymentSession({ status: 'captured', redirectUrl: null }),
        ),
      })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
      await session.submitPayment()
      expect(() => session.setAmount(200)).toThrow('Cannot update amount')
    })
  })

  describe('setOrderId', () => {
    it('sets order ID', () => {
      session.setOrderId('order-abc')
      expect(session.orderId).toBe('order-abc')
    })
  })

  // ---- toSnapshot -------------------------------------------------------

  describe('toSnapshot', () => {
    it('returns serializable snapshot', () => {
      session.setCustomerInfo({ email: 'ali@example.com', firstName: 'Ali' })
      const snap = session.toSnapshot()

      expect(snap.state).toBe('info')
      expect(snap.customerInfo).toEqual({ email: 'ali@example.com', firstName: 'Ali' })
      expect(snap.amount).toBe(99.99)
      expect(snap.currency).toBe('SAR')
      expect(snap.error).toBeNull()
    })

    it('includes error message when failed', async () => {
      const provider = mockProvider({
        createSession: vi.fn().mockRejectedValue(new Error('Oops')),
      })
      session = new CheckoutSession(defaultConfig({ paymentProvider: provider }))
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      session.setShippingMethod('standard')
      await session.submitPayment().catch(() => {})

      const snap = session.toSnapshot()
      expect(snap.state).toBe('failed')
      expect(snap.error).toBe('Oops')
    })
  })

  // ---- Invalid transitions ----------------------------------------------

  describe('invalid transitions', () => {
    it('cannot skip from idle to shipping', () => {
      expect(() => session.setShippingAddress(address))
        .toThrow('Invalid transition: "idle" → "shipping"')
    })

    it('cannot go backwards from shipping to info', () => {
      session.setCustomerInfo({ email: 'ali@example.com' })
      session.setShippingAddress(address)
      expect(() => session.setCustomerInfo({ email: 'other@example.com' }))
        .toThrow('Invalid transition')
    })
  })
})
