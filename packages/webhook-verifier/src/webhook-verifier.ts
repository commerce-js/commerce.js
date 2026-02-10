// ---------------------------------------------------------------------------
// @commercejs/webhook-verifier
// ---------------------------------------------------------------------------
// Webhook signature verification with built-in provider formatters.
// Ported from @xyz/webhook-verifier with extensible provider configs.
// ---------------------------------------------------------------------------

import crypto from 'node:crypto'

// ---- Types -----------------------------------------------------------------

/** Webhook payload — any JSON object */
export interface WebhookPayload {
  [key: string]: any
}

/** Result of webhook verification */
export interface VerificationResult {
  isValid: boolean
  error?: string
  data?: any
}

/** Configuration for the webhook verifier */
export interface WebhookConfig {
  /** Enable debug logging */
  debug?: boolean
  /** Secret key used for HMAC generation */
  secretKey: string
  /** Header name that contains the signature */
  signatureHeader: string
  /** Optional prefix on the signature (e.g., 'sha256=') */
  signaturePrefix?: string
  /** Hash algorithm (default: 'sha256') */
  hashAlgorithm?: string
  /** Output encoding (default: 'hex') */
  encoding?: 'hex' | 'base64'
  /** Custom payload formatter — transforms payload before hashing */
  payloadFormatter?: (payload: WebhookPayload) => string
}

// ---- WebhookVerifier class -------------------------------------------------

export class WebhookVerifier {
  public readonly config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = {
      debug: false,
      hashAlgorithm: 'sha256',
      encoding: 'hex',
      ...config,
    }

    if (!this.config.secretKey) {
      throw new Error('Secret key is required')
    }
    if (!this.config.signatureHeader) {
      throw new Error('Signature header name is required')
    }
  }

  private generateHash(payload: string): string {
    const hmac = crypto.createHmac(this.config.hashAlgorithm!, this.config.secretKey)
    hmac.update(payload)
    return hmac.digest(this.config.encoding!)
  }

  private formatSignature(hash: string): string {
    if (this.config.signaturePrefix) {
      return `${this.config.signaturePrefix}${hash}`
    }
    return hash
  }

  private formatPayload(payload: WebhookPayload): string {
    if (this.config.payloadFormatter) {
      return this.config.payloadFormatter(payload)
    }
    return JSON.stringify(payload)
  }

  /**
   * Extract signature from headers using the configured signatureHeader.
   * Handles case-insensitive lookups and array-valued headers.
   */
  private extractSignature(headers: Record<string, any>): string | undefined {
    const headerName = this.config.signatureHeader.toLowerCase()

    // Direct access
    let signature = headers[headerName]

    // Case-insensitive fallback
    if (!signature) {
      const headerKey = Object.keys(headers).find(
        key => key.toLowerCase() === headerName,
      )
      if (headerKey) {
        signature = headers[headerKey]
      }
    }

    // Handle array of strings (some HTTP libraries do this)
    if (Array.isArray(signature)) {
      signature = signature[0]
    }

    return signature as string | undefined
  }

  /**
   * Verify a webhook payload.
   *
   * @param payload - The webhook body (parsed JSON)
   * @param signatureOrHeaders - Either the signature string directly, or the
   *   full request headers object (signature will be auto-extracted)
   */
  verify(
    payload: WebhookPayload,
    signatureOrHeaders: string | Record<string, any>,
  ): VerificationResult {
    let signature: string | undefined

    if (typeof signatureOrHeaders === 'string') {
      signature = signatureOrHeaders
    }
    else if (typeof signatureOrHeaders === 'object' && signatureOrHeaders !== null) {
      signature = this.extractSignature(signatureOrHeaders)

      if (!signature) {
        return {
          isValid: false,
          error: `Missing signature header: ${this.config.signatureHeader}`,
        }
      }
    }
    else {
      return {
        isValid: false,
        error: 'Invalid signature or headers argument',
      }
    }

    try {
      if (!signature) {
        return { isValid: false, error: 'Missing signature' }
      }

      const formattedPayload = this.formatPayload(payload)
      const hash = this.generateHash(formattedPayload)
      const generatedSignature = this.formatSignature(hash)

      if (this.config.debug) {
        console.log('Webhook verification:', {
          header: this.config.signatureHeader,
          receivedSignature: signature,
          generatedSignature,
          receivedPayload: payload,
          formattedPayload,
        })
      }

      if (signature !== generatedSignature) {
        return { isValid: false, error: 'Invalid signature' }
      }

      return { isValid: true, data: payload }
    }
    catch (error) {
      if (this.config.debug) console.error('Webhook verification error:', error)
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error during verification',
      }
    }
  }
}
