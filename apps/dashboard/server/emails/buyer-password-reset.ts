// ---------------------------------------------------------------------------
// Buyer password-reset email — transactional-emails T02 (storefront customer)
// ---------------------------------------------------------------------------

import type { Template } from './_types'

export interface BuyerPasswordResetVars {
  /** Buyer's first name (if set); undefined otherwise. */
  name?: string | null
  /** Storefront display name. */
  storeName: string
  /** Full URL to /account/reset/{token} on the merchant's storefront. */
  resetUrl: string
  /** ISO 8601 expiry. */
  expiresAt: string
}

function greeting(name?: string | null): string {
  const trimmed = name?.trim()
  return trimmed ? `Hi ${trimmed},` : 'Hi,'
}

function formatExpiry(isoString: string): string {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return isoString
  return d.toUTCString()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const buyerPasswordResetTemplate: Template<BuyerPasswordResetVars> = {
  key: 'buyer-password-reset',
  subject: (vars) => `Reset your password at ${vars.storeName}`,
  html: (vars) => {
    const safe = {
      greeting: escapeHtml(greeting(vars.name)),
      storeName: escapeHtml(vars.storeName),
      resetUrl: escapeHtml(vars.resetUrl),
      expiry: escapeHtml(formatExpiry(vars.expiresAt)),
    }
    return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>${safe.greeting}</p>
  <p>We received a request to reset the password for your account at <strong>${safe.storeName}</strong>.</p>
  <p>Click the button below to set a new password:</p>
  <p style="margin: 24px 0;">
    <a href="${safe.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset password</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Or copy and paste this URL into your browser:<br><span style="word-break: break-all;">${safe.resetUrl}</span></p>
  <p style="color: #6b7280; font-size: 14px;">This link expires on ${safe.expiry}.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
</body>
</html>`
  },
  text: (vars) => [
    greeting(vars.name),
    '',
    `We received a request to reset the password for your account at ${vars.storeName}.`,
    '',
    'Set a new password by opening this link:',
    vars.resetUrl,
    '',
    `This link expires on ${formatExpiry(vars.expiresAt)}.`,
    '',
    `— ${vars.storeName}`,
    '',
    "If you didn't request this, you can safely ignore this email.",
  ].join('\n'),
}
