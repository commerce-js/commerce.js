// ---------------------------------------------------------------------------
// POST /api/admin/staff — create a staff user (owner-only)
// ---------------------------------------------------------------------------
//
// Two modes:
//
//   1. `sendInvite: true`  — creates the row with status='invited' +
//      password_hash=NULL, generates a single-use token, enqueues a
//      SendEmailJob carrying the token in an `inviteUrl` that points at
//      the merchant's storefront /admin/invite/{token} page. The invitee
//      opens the link and sets their own password. T09's post-create
//      password banner doesn't render in this mode — the show-once
//      secret only exists in the email.
//
//   2. `password: <plaintext>` — T09's original flow: owner types a
//      password, hands it to the new user out-of-band. No email sent.
//
// The platform's createAdmin enforces the "at least one of (password,
// sendInvite)" rule; the schema layer enforces it again for better
// client-side error messages.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError, getRequestHost, getRequestProtocol } from 'h3'
import { requireOwner } from '../../../utils/require-role'
import { parseOrThrow } from '../../../utils/admin-validate'
import { createStaffSchema } from '../../../utils/admin-schemas'
import { recordActivity } from '../../../utils/audit'
import { enqueueMerchantJob } from '../../../utils/queue'
import { getMerchantSession } from '../../../utils/merchant-session'

export default defineEventHandler(async (event) => {
  await requireOwner(event)

  const admin = event.context.admin
  const merchant = event.context.merchant
  if (!admin || !merchant) {
    throw createError({ statusCode: 500, statusMessage: 'Admin context missing' })
  }

  const body = await readBody(event)
  const input = parseOrThrow(createStaffSchema, body)

  let result
  try {
    result = await admin.auth.createAdmin({
      email: input.email,
      ...(input.password ? { password: input.password } : {}),
      name: input.name,
      role: input.role,
      ...(input.sendInvite ? { sendInvite: true as const } : {}),
    })
  }
  catch (err: any) {
    const msg = err?.message ?? 'Could not create staff user'
    if (/already exists/i.test(msg)) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: msg })
    }
    throw createError({ statusCode: 400, statusMessage: 'Bad request', message: msg })
  }

  const { admin: created, invite } = result

  if (invite) {
    // Dispatch the invite email via the merchant-jobs queue. The worker's
    // handleSendEmail renders the template and hands it to the SMTP
    // provider. Failures retry with backoff (queue default: 5 attempts).
    const host = getRequestHost(event, { xForwardedHost: true })
    const proto = getRequestProtocol(event, { xForwardedProto: true })
    const inviteUrl = `${proto}://${host}/admin/invite/${invite.token}`

    const session = await getMerchantSession(event)

    await enqueueMerchantJob({
      type: 'send-email',
      data: {
        merchantId: merchant.id,
        to: created.email,
        template: 'staff-invite',
        vars: {
          name: created.name,
          storeName: merchant.name,
          inviteUrl,
          expiresAt: invite.expiresAt.toISOString(),
          inviterName: session?.name ?? session?.email ?? 'An owner',
        },
      },
    })

    await recordActivity(event, 'staff.invited', 'staff', created.id, {
      email: created.email,
      role: created.role,
      expiresAt: invite.expiresAt.toISOString(),
    })
  }
  else {
    await recordActivity(event, 'staff.created', 'staff', created.id, {
      email: created.email,
      role: created.role,
    })
  }

  return created
})
