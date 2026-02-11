import { describe, it, expect } from 'vitest'
import { tap } from '../formatters/tap.js'

// ---------------------------------------------------------------------------
// Tap Payload Formatter Tests
// ---------------------------------------------------------------------------

describe('Tap formatter', () => {
  // ---- Charge payloads ---------------------------------------------------

  describe('charge payloads', () => {
    it('formats a complete charge payload', () => {
      const result = tap({
        id: 'chg_123',
        object: 'charge',
        amount: 99.99,
        currency: 'SAR',
        status: 'CAPTURED',
        transaction: { created: '1700000000' },
        reference: { gateway: 'gw_ref', payment: 'pay_ref' },
      })

      expect(result).toBe(
        'x_idchg_123'
        + 'x_amount99.99'
        + 'x_currencySAR'
        + 'x_gateway_referencegw_ref'
        + 'x_payment_referencepay_ref'
        + 'x_statusCAPTURED'
        + 'x_created1700000000',
      )
    })

    it('formats authorize payloads', () => {
      const result = tap({
        id: 'auth_456',
        object: 'authorize',
        amount: 50,
        currency: 'USD',
        status: 'AUTHORIZED',
        transaction: { created: '1700000001' },
        reference: { gateway: 'gw_2', payment: 'pay_2' },
      })

      expect(result).toContain('x_idauth_456')
      expect(result).toContain('x_amount50.00')
      expect(result).toContain('x_currencyUSD')
      expect(result).toContain('x_gateway_referencegw_2')
    })

    it('formats refund payloads', () => {
      const result = tap({
        id: 'ref_789',
        object: 'refund',
        amount: 25.50,
        currency: 'AED',
        status: 'REFUNDED',
        transaction: { created: '1700000002' },
        reference: { gateway: 'gw_3', payment: 'pay_3' },
      })

      expect(result).toContain('x_idref_789')
      expect(result).toContain('x_amount25.50')
      expect(result).toContain('x_statusREFUNDED')
    })
  })

  // ---- Invoice payloads --------------------------------------------------

  describe('invoice payloads', () => {
    it('formats an invoice payload with unique fields', () => {
      const result = tap({
        id: 'inv_001',
        object: 'invoice',
        amount: 100,
        currency: 'SAR',
        updated: '2024-01-15',
        status: 'PAID',
        created: '2024-01-01',
      })

      expect(result).toBe(
        'x_idinv_001'
        + 'x_amount100.00'
        + 'x_currencySAR'
        + 'x_updated2024-01-15'
        + 'x_statusPAID'
        + 'x_created2024-01-01',
      )
    })
  })

  // ---- Currency decimal formatting ---------------------------------------

  describe('currency decimal formatting', () => {
    it('formats SAR with 2 decimals', () => {
      const result = tap({ id: '1', amount: 10, currency: 'SAR' })
      expect(result).toContain('x_amount10.00')
    })

    it('formats BHD with 3 decimals', () => {
      const result = tap({ id: '1', amount: 10, currency: 'BHD' })
      expect(result).toContain('x_amount10.000')
    })

    it('formats KWD with 3 decimals', () => {
      const result = tap({ id: '1', amount: 5.5, currency: 'KWD' })
      expect(result).toContain('x_amount5.500')
    })

    it('formats OMR with 3 decimals', () => {
      const result = tap({ id: '1', amount: 1, currency: 'OMR' })
      expect(result).toContain('x_amount1.000')
    })

    it('defaults unknown currencies to 2 decimals', () => {
      const result = tap({ id: '1', amount: 50, currency: 'XYZ' })
      expect(result).toContain('x_amount50.00')
    })
  })

  // ---- Missing fields ----------------------------------------------------

  describe('missing fields', () => {
    it('handles missing id', () => {
      const result = tap({ amount: 10, currency: 'SAR' })
      expect(result).toContain('x_id')
    })

    it('handles missing amount', () => {
      const result = tap({ id: '1', currency: 'SAR' })
      expect(result).toContain('x_amount')
      expect(result).not.toContain('x_amount0')
    })

    it('handles missing currency', () => {
      const result = tap({ id: '1', amount: 10 })
      expect(result).toContain('x_currency')
    })

    it('handles completely empty payload', () => {
      const result = tap({})
      expect(result).toBe('x_idx_amountx_currency')
    })
  })
})
