// ---------------------------------------------------------------------------
// POST /api/auth/login — email/password sign-in against DashboardUser
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { compare } from 'bcrypt-ts'
import { useDB } from '../../utils/db'
import { setDashboardSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  const db = useDB()
  const user = await db.dashboardUser.findUnique({
    where: { email: body.email.toLowerCase().trim() },
  })

  // Generic error for both unknown-email and bad-password to avoid
  // enumerating valid operator accounts.
  const GENERIC_ERROR = createError({ statusCode: 401, message: 'Invalid email or password' })
  if (!user) throw GENERIC_ERROR

  const ok = await compare(body.password, user.passwordHash)
  if (!ok) throw GENERIC_ERROR

  await setDashboardSession(event, {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: (user.role === 'support' ? 'support' : 'admin'),
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
})
