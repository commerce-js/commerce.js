// ---------------------------------------------------------------------------
// Order confirmation email — transactional-emails T03
// ---------------------------------------------------------------------------
//
// Sent to the buyer whenever an order becomes "real":
//   - storefront-native path → POST /api/storefront/checkout/complete
//     (COD / bank transfer / free orders via adapter.placeOrder)
//   - hosted-checkout Tap path → webhooks/tap-payment.post.ts captures →
//     status pending → processing → enqueue here
//
// The template consumes pre-rendered `formatted` strings for every money
// field (subtotal, shipping, tax, total, line-item totals). Adapters own
// currency rules — BHD has 3 decimals, JOD has 3, most others 2 — so any
// hand-rolled `amount.toFixed(...)` here would get the wrong answer for
// Bahrain. Producer-side formatting is load-bearing.
//
// English only for v1; Arabic localization ships when Merchant.locale is
// branched into the dispatcher (same deferred TODO as T01/T02).
// ---------------------------------------------------------------------------

import type { Template } from './_types'

export interface OrderConfirmationLineItem {
  /** Product name — already resolved from LocalizedString to a single locale. */
  name: string
  quantity: number
  /** Pre-formatted line total (e.g. "BHD 12.500"). */
  totalFormatted: string
  /** Optional thumbnail URL. When null/undefined, the HTML <img> is skipped. */
  imageUrl?: string | null
}

export interface OrderConfirmationAddress {
  firstName: string
  lastName: string
  street: string
  street2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
}

export interface OrderConfirmationVars {
  /** Buyer-facing order number (not the internal UUID id). */
  orderNumber: string
  /** Buyer's display name; falls back to generic greeting when missing. */
  buyerName?: string | null
  /** Storefront display name — from `merchant.name`. */
  storeName: string
  /** Deep-link to the buyer's order-status page on the merchant storefront. */
  orderStatusUrl: string
  /** ISO 4217 currency code (used in the subject line). */
  currency: string
  /** Pre-formatted order total — consume `order.totals.total.formatted`. */
  totalFormatted: string
  /** Pre-formatted subtotal. */
  subtotalFormatted: string
  /** Pre-formatted shipping — undefined/null when free or pickup. */
  shippingFormatted?: string | null
  /** Pre-formatted tax — undefined/null when tax-inclusive or zero. */
  taxFormatted?: string | null
  /** Line items, already flattened from OrderItem[]. */
  items: OrderConfirmationLineItem[]
  /** Shipping address; null for digital-only orders / BOPIS. */
  shippingAddress?: OrderConfirmationAddress | null
}

function greeting(name?: string | null): string {
  const trimmed = name?.trim()
  return trimmed ? `Hi ${trimmed},` : 'Hi there,'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Format an address block as HTML (multiline with <br>). Returns empty
 * string when address is null. Every user-controlled field is escaped.
 */
function renderAddressHtml(addr: OrderConfirmationAddress | null | undefined): string {
  if (!addr) return ''
  const lines: string[] = []
  lines.push(escapeHtml(`${addr.firstName} ${addr.lastName}`.trim()))
  lines.push(escapeHtml(addr.street))
  if (addr.street2?.trim()) lines.push(escapeHtml(addr.street2))
  const cityLine = [addr.city, addr.state, addr.postalCode]
    .filter((v): v is string => Boolean(v?.trim()))
    .join(', ')
  if (cityLine) lines.push(escapeHtml(cityLine))
  lines.push(escapeHtml(addr.country))
  return lines.join('<br>')
}

function renderAddressText(addr: OrderConfirmationAddress | null | undefined): string {
  if (!addr) return ''
  const lines: string[] = []
  lines.push(`${addr.firstName} ${addr.lastName}`.trim())
  lines.push(addr.street)
  if (addr.street2?.trim()) lines.push(addr.street2)
  const cityLine = [addr.city, addr.state, addr.postalCode]
    .filter((v): v is string => Boolean(v?.trim()))
    .join(', ')
  if (cityLine) lines.push(cityLine)
  lines.push(addr.country)
  return lines.join('\n')
}

export const orderConfirmationTemplate: Template<OrderConfirmationVars> = {
  key: 'order-confirmation',
  subject: vars =>
    `Order ${vars.orderNumber} confirmed — ${vars.storeName}`,
  html: (vars) => {
    const safe = {
      greeting: escapeHtml(greeting(vars.buyerName)),
      storeName: escapeHtml(vars.storeName),
      orderNumber: escapeHtml(vars.orderNumber),
      orderStatusUrl: escapeHtml(vars.orderStatusUrl),
      subtotal: escapeHtml(vars.subtotalFormatted),
      total: escapeHtml(vars.totalFormatted),
    }
    const itemRows = vars.items
      .map((item) => {
        const name = escapeHtml(item.name)
        const qty = escapeHtml(String(item.quantity))
        const lineTotal = escapeHtml(item.totalFormatted)
        const img = item.imageUrl
          ? `<img src="${escapeHtml(item.imageUrl)}" alt="" width="56" height="56" style="vertical-align: middle; border-radius: 4px; margin-right: 12px; object-fit: cover;">`
          : ''
        return `<tr>
  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${img}<span style="font-weight: 500;">${name}</span><br><span style="color: #6b7280; font-size: 14px;">Qty ${qty}</span></td>
  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">${lineTotal}</td>
</tr>`
      })
      .join('\n')
    const shippingRow = vars.shippingFormatted
      ? `<tr><td style="padding: 4px 0; color: #6b7280;">Shipping</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(vars.shippingFormatted)}</td></tr>`
      : ''
    const taxRow = vars.taxFormatted
      ? `<tr><td style="padding: 4px 0; color: #6b7280;">Tax</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(vars.taxFormatted)}</td></tr>`
      : ''
    const addressBlock = vars.shippingAddress
      ? `<div style="margin: 24px 0;">
  <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping to</p>
  <p style="margin: 0; line-height: 1.5;">${renderAddressHtml(vars.shippingAddress)}</p>
</div>`
      : ''
    return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 24px;">
  <p>${safe.greeting}</p>
  <p>Thanks for ordering from <strong>${safe.storeName}</strong>! Your order <strong>${safe.orderNumber}</strong> is confirmed and on its way.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <thead>
      <tr>
        <th style="text-align: left; padding: 12px 0; border-bottom: 2px solid #1f2937; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
        <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid #1f2937; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
      </tr>
    </thead>
    <tbody>
${itemRows}
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
    <tr><td style="padding: 4px 0; color: #6b7280;">Subtotal</td><td style="padding: 4px 0; text-align: right;">${safe.subtotal}</td></tr>
    ${shippingRow}
    ${taxRow}
    <tr><td style="padding: 12px 0 0; border-top: 1px solid #e5e7eb; font-weight: 600;">Total</td><td style="padding: 12px 0 0; border-top: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${safe.total}</td></tr>
  </table>

  ${addressBlock}

  <p style="margin: 24px 0;">
    <a href="${safe.orderStatusUrl}" style="display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">View order status</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Or copy and paste this URL into your browser:<br><span style="word-break: break-all;">${safe.orderStatusUrl}</span></p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="color: #9ca3af; font-size: 12px;">Questions about your order? Reply to this email — the ${safe.storeName} team is on it.</p>
</body>
</html>`
  },
  text: (vars) => {
    const lines: string[] = []
    lines.push(greeting(vars.buyerName))
    lines.push('')
    lines.push(`Thanks for ordering from ${vars.storeName}!`)
    lines.push(`Your order ${vars.orderNumber} is confirmed.`)
    lines.push('')
    lines.push('Items:')
    for (const item of vars.items) {
      lines.push(`  • ${item.name} × ${item.quantity}  —  ${item.totalFormatted}`)
    }
    lines.push('')
    lines.push(`Subtotal:  ${vars.subtotalFormatted}`)
    if (vars.shippingFormatted) lines.push(`Shipping:  ${vars.shippingFormatted}`)
    if (vars.taxFormatted) lines.push(`Tax:       ${vars.taxFormatted}`)
    lines.push(`Total:     ${vars.totalFormatted}`)
    if (vars.shippingAddress) {
      lines.push('')
      lines.push('Shipping to:')
      lines.push(renderAddressText(vars.shippingAddress))
    }
    lines.push('')
    lines.push('View your order status:')
    lines.push(vars.orderStatusUrl)
    lines.push('')
    lines.push(`— The ${vars.storeName} team`)
    return lines.join('\n')
  },
}
