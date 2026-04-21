// ---------------------------------------------------------------------------
// Staff invite email — first vertical slice of the transactional-emails plan
// ---------------------------------------------------------------------------
//
// Sent when an owner invites a new staff member from /admin/staff/new with
// the "Send invite email" toggle on. The `inviteUrl` points at the MERCHANT'S
// storefront (e.g. https://{subdomain}.commercejs.cloud/admin/invite/{token})
// because /admin is served by the storefront process, not the dashboard.
// ---------------------------------------------------------------------------

import type { Template } from './_types'

// Arabic localization is a v2 concern — the storefront admin surface is
// English-only today. When Merchant.locale gains an Arabic branch, add a
// second template file and let the dispatcher pick the right one based on
// the admin user's preferred language.

export interface StaffInviteVars {
  /** Invitee's name if the owner filled it in; undefined otherwise. */
  name?: string | null
  /** Storefront display name — e.g. 'Acme Co'. */
  storeName: string
  /** Full URL to /admin/invite/{token} on the merchant's storefront. */
  inviteUrl: string
  /** ISO 8601 expiry — rendered as a date in the email. */
  expiresAt: string
  /** Name or email of the staff member who sent the invite. */
  inviterName: string
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

export const staffInviteTemplate: Template<StaffInviteVars> = {
  key: 'staff-invite',
  subject: (vars) =>
    `You're invited to join ${vars.storeName} on CommerceJS Cloud`,
  html: (vars) => {
    const safe = {
      greeting: escapeHtml(greeting(vars.name)),
      storeName: escapeHtml(vars.storeName),
      inviter: escapeHtml(vars.inviterName),
      inviteUrl: escapeHtml(vars.inviteUrl),
      expiry: escapeHtml(formatExpiry(vars.expiresAt)),
    }
    return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>${safe.greeting}</p>
  <p>${safe.inviter} invited you to join <strong>${safe.storeName}</strong> on CommerceJS Cloud as a staff member.</p>
  <p>Click the button below to set your password and sign in:</p>
  <p style="margin: 24px 0;">
    <a href="${safe.inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Accept invite</a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Or copy and paste this URL into your browser:<br><span style="word-break: break-all;">${safe.inviteUrl}</span></p>
  <p style="color: #6b7280; font-size: 14px;">This invite expires on ${safe.expiry}.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="color: #9ca3af; font-size: 12px;">If you weren't expecting this invite, you can safely ignore this email.</p>
</body>
</html>`
  },
  text: (vars) => {
    const lines = [
      greeting(vars.name),
      '',
      `${vars.inviterName} invited you to join ${vars.storeName} on CommerceJS Cloud as a staff member.`,
      '',
      'Set your password and sign in by opening this link:',
      vars.inviteUrl,
      '',
      `This invite expires on ${formatExpiry(vars.expiresAt)}.`,
      '',
      '— CommerceJS Cloud',
      '',
      "If you weren't expecting this invite, you can safely ignore this email.",
    ]
    return lines.join('\n')
  },
}
