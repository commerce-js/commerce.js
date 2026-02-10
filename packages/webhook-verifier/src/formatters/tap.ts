import type { WebhookPayload } from '../webhook-verifier.js'

// ---------------------------------------------------------------------------
// Tap Payments formatter
// ---------------------------------------------------------------------------
// Formats the payload according to Tap's webhook hashstring requirements.
// Handles currency-aware decimal formatting and different object types
// (charge, authorize, refund, invoice).
//
// See: https://developers.tap.company/docs/webhook#validate-the-webhook-hashstring
// ---------------------------------------------------------------------------

/** Decimal places per currency — Tap requires exact formatting */
const CURRENCY_DECIMALS: Record<string, number> = {
  BHD: 3,
  KWD: 3,
  OMR: 3,
  JOD: 3,
  AED: 2,
  SAR: 2,
  QAR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  EGP: 2,
}

function formatAmount(amount: number, currency: string): string {
  const decimals = CURRENCY_DECIMALS[currency] || 2
  return Number(amount).toFixed(decimals)
}

export const tap = (payload: WebhookPayload): string => {
  const fields = [
    `x_id${payload.id || ''}`,
    `x_amount${payload.amount ? formatAmount(payload.amount, payload.currency || 'USD') : ''}`,
    `x_currency${payload.currency || ''}`,
  ]

  // Invoice-specific fields
  if (payload.object === 'invoice') {
    fields.push(
      `x_updated${payload.updated || ''}`,
      `x_status${payload.status || ''}`,
      `x_created${payload.created || ''}`,
    )
  }

  // Charge / authorize / refund fields
  if (
    ['charge', 'authorize', 'refund'].includes(payload.object || '')
    && 'transaction' in payload
    && 'reference' in payload
  ) {
    fields.push(
      `x_gateway_reference${payload.reference?.gateway || ''}`,
      `x_payment_reference${payload.reference?.payment || ''}`,
      `x_status${payload.status || ''}`,
      `x_created${payload.transaction?.created || ''}`,
    )
  }

  return fields.join('')
}
