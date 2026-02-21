import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import { WebhookVerifier } from '../webhook-verifier.js'
import type { WebhookConfig } from '../webhook-verifier.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultConfig(overrides: Partial<WebhookConfig> = {}): WebhookConfig {
  return {
    secretKey: 'test_secret_key',
    signatureHeader: 'x-signature',
    ...overrides,
  }
}

/** Compute a real HMAC to use as the "expected" signature in tests */
function computeHmac(
  payload: string,
  secret: string,
  algorithm = 'sha256',
  encoding: 'hex' | 'base64' = 'hex',
): string {
  return crypto.createHmac(algorithm, secret).update(payload).digest(encoding)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WebhookVerifier', () => {
  // ---- Constructor --------------------------------------------------------

  describe('constructor', () => {
    it('throws if secretKey is empty', () => {
      expect(() => new WebhookVerifier({ secretKey: '', signatureHeader: 'x-sig' }))
        .toThrow('Secret key is required')
    })

    it('throws if signatureHeader is empty', () => {
      expect(() => new WebhookVerifier({ secretKey: 'key', signatureHeader: '' }))
        .toThrow('Signature header name is required')
    })

    it('applies default hashAlgorithm and encoding', () => {
      const verifier = new WebhookVerifier(defaultConfig())
      expect(verifier.config.hashAlgorithm).toBe('sha256')
      expect(verifier.config.encoding).toBe('hex')
      expect(verifier.config.debug).toBe(false)
    })

    it('allows overriding defaults', () => {
      const verifier = new WebhookVerifier(defaultConfig({
        hashAlgorithm: 'sha512',
        encoding: 'base64',
        debug: true,
      }))
      expect(verifier.config.hashAlgorithm).toBe('sha512')
      expect(verifier.config.encoding).toBe('base64')
      expect(verifier.config.debug).toBe(true)
    })
  })

  // ---- verify() with string signature ------------------------------------

  describe('verify with string signature', () => {
    it('returns isValid: true for a valid signature', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const payload = { event: 'charge.captured', id: '123' }
      const payloadStr = JSON.stringify(payload)
      const signature = computeHmac(payloadStr, 'test_secret_key')

      const result = await verifier.verify(payload, signature)
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual(payload)
      expect(result.error).toBeUndefined()
    })

    it('returns isValid: false for an invalid signature', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const payload = { event: 'charge.captured' }

      const result = await verifier.verify(payload, 'bad_signature')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('returns isValid: false for an empty string signature', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const result = await verifier.verify({ id: '1' }, '')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Missing signature')
    })
  })

  // ---- verify() with headers object --------------------------------------

  describe('verify with headers object', () => {
    it('extracts signature from matching header', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key')

      const result = await verifier.verify(payload, { 'x-signature': signature })
      expect(result.isValid).toBe(true)
    })

    it('extracts signature case-insensitively', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key')

      const result = await verifier.verify(payload, { 'X-Signature': signature })
      expect(result.isValid).toBe(true)
    })

    it('handles array-valued headers', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key')

      const result = await verifier.verify(payload, { 'x-signature': [signature, 'extra'] })
      expect(result.isValid).toBe(true)
    })

    it('returns error when signature header is missing', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const result = await verifier.verify({ id: '1' }, { 'other-header': 'value' })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Missing signature header')
    })

    it('returns error for invalid argument type', async () => {
      const verifier = new WebhookVerifier(defaultConfig())
      const result = await verifier.verify({ id: '1' }, null as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid signature or headers argument')
    })
  })

  // ---- signaturePrefix ---------------------------------------------------

  describe('signaturePrefix', () => {
    it('prepends prefix to generated signature', async () => {
      const verifier = new WebhookVerifier(defaultConfig({
        signaturePrefix: 'sha256=',
      }))
      const payload = { id: 'test' }
      const hash = computeHmac(JSON.stringify(payload), 'test_secret_key')

      const result = await verifier.verify(payload, `sha256=${hash}`)
      expect(result.isValid).toBe(true)
    })

    it('fails when prefix is missing from provided signature', async () => {
      const verifier = new WebhookVerifier(defaultConfig({
        signaturePrefix: 'sha256=',
      }))
      const payload = { id: 'test' }
      const hash = computeHmac(JSON.stringify(payload), 'test_secret_key')

      // Providing hash without prefix should fail
      const result = await verifier.verify(payload, hash)
      expect(result.isValid).toBe(false)
    })
  })

  // ---- payloadFormatter --------------------------------------------------

  describe('payloadFormatter', () => {
    it('uses custom formatter when provided', async () => {
      const formatter = vi.fn((p: any) => `custom:${p.id}`)
      const verifier = new WebhookVerifier(defaultConfig({
        payloadFormatter: formatter,
      }))
      const payload = { id: 'abc' }
      const signature = computeHmac('custom:abc', 'test_secret_key')

      const result = await verifier.verify(payload, signature)
      expect(result.isValid).toBe(true)
      expect(formatter).toHaveBeenCalledWith(payload)
    })
  })

  // ---- encoding ----------------------------------------------------------

  describe('encoding', () => {
    it('supports base64 encoding', async () => {
      const verifier = new WebhookVerifier(defaultConfig({ encoding: 'base64' }))
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key', 'sha256', 'base64')

      const result = await verifier.verify(payload, signature)
      expect(result.isValid).toBe(true)
    })
  })

  // ---- hashAlgorithm -----------------------------------------------------

  describe('hashAlgorithm', () => {
    it('supports sha512', async () => {
      const verifier = new WebhookVerifier(defaultConfig({ hashAlgorithm: 'sha512' }))
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key', 'sha512')

      const result = await verifier.verify(payload, signature)
      expect(result.isValid).toBe(true)
    })
  })

  // ---- debug mode --------------------------------------------------------

  describe('debug mode', () => {
    it('logs verification details when debug is enabled', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const verifier = new WebhookVerifier(defaultConfig({ debug: true }))
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key')

      await verifier.verify(payload, signature)
      expect(spy).toHaveBeenCalledWith('Webhook verification:', expect.objectContaining({
        header: 'x-signature',
        receivedSignature: signature,
      }))

      spy.mockRestore()
    })

    it('does not log when debug is disabled', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const verifier = new WebhookVerifier(defaultConfig({ debug: false }))
      const payload = { id: 'test' }
      const signature = computeHmac(JSON.stringify(payload), 'test_secret_key')

      await verifier.verify(payload, signature)
      expect(spy).not.toHaveBeenCalled()

      spy.mockRestore()
    })
  })
})
