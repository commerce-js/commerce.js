// ---------------------------------------------------------------------------
// POST /api/admin/auth/login — merchant staff sign-in
// ---------------------------------------------------------------------------
//
// Authenticates against the merchant's per-branch `admin_users` table
// (populated by event.context.admin.auth). Tenant middleware has already
// resolved the merchant from the subdomain and bound the branch adapter,
// so event.context.admin is the AdminAPI scoped to this merchant's DB.
//
// First-login bootstrap:
//   If `admin_users` on the branch is empty, we seed the first row from
//   the control-DB Merchant record (email + password_hash). This converts
//   the sign-up credential into the merchant's initial `owner` admin
//   account, with no provisioning-time coupling. Once that first row
//   exists, all subsequent logins authenticate against the branch — the
//   control-DB password becomes a read-only backstop.
//
// Error hygiene: every failure returns a generic 401 "Invalid email or
// password". We never distinguish between "no such user", "wrong password",
// or "no merchant bootstrap credential" — matches the dashboard-operator
// login at server/api/auth/login.post.ts.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { compare } from 'bcrypt-ts'
import { setMerchantSession } from '../../../utils/merchant-session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  const email = body.email.toLowerCase().trim()
  const password = body.password

  const merchant = event.context.merchant
  const admin = event.context.admin
  if (!merchant || !admin) {
    // Tenant middleware should have set these. If it didn't, this host
    // isn't a merchant subdomain.
    throw createError({ statusCode: 404, statusMessage: 'Merchant not found' })
  }

  const GENERIC_ERROR = createError({ statusCode: 401, statusMessage: 'Invalid email or password' })

  // Bootstrap path — only triggers when the branch has no admins yet.
  // Seeds the owner row from the control-DB Merchant credential so the
  // very first login "just works" for the merchant owner.
  const existing = await admin.auth.listAdmins()
  if (existing.length === 0) {
    if (!merchant.passwordHash) throw GENERIC_ERROR
    if (merchant.email.toLowerCase() !== email) throw GENERIC_ERROR

    const valid = await compare(password, merchant.passwordHash)
    if (!valid) throw GENERIC_ERROR

    // createAdmin hashes the password again — we pass plaintext here.
    // Two concurrent first-logins race the UNIQUE(email) constraint; the
    // loser falls through to the normal login path below.
    try {
      await admin.auth.createAdmin({
        email: merchant.email,
        password,
        name: merchant.name,
        role: 'owner',
      })
    }
    catch { /* race — let admin.auth.login below decide */ }
  }

  // Normal path — authenticate against the branch.
  let user
  try {
    user = await admin.auth.login(email, password)
  }
  catch {
    throw GENERIC_ERROR
  }

  await setMerchantSession(event, {
    userId: user.id,
    merchantId: merchant.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
})
