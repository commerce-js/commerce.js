import type { WebhookConfig } from '../webhook-verifier.js'
import { tap as tapFormatter } from '../formatters/index.js'

/**
 * Tap Payments webhook config preset.
 *
 * Usage:
 * ```ts
 * import { WebhookVerifier } from '@commercejs/webhook-verifier'
 * import { tap } from '@commercejs/webhook-verifier/configs'
 *
 * const verifier = new WebhookVerifier({
 *   ...tap,
 *   secretKey: 'sk_live_...',
 * })
 * ```
 */
export const tap: Omit<WebhookConfig, 'secretKey'> = {
  signatureHeader: 'hashstring',
  hashAlgorithm: 'sha256',
  encoding: 'hex',
  payloadFormatter: tapFormatter,
}
