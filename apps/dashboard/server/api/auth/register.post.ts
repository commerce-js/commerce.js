// ---------------------------------------------------------------------------
// POST /api/auth/register — bootstrap the FIRST dashboard operator
// ---------------------------------------------------------------------------
//
// Self-registration is enabled ONLY while `dashboard_users` is empty. Once
// the first admin exists, subsequent accounts must be created by an
// existing admin (out-of-scope here — a POST /api/admin/users endpoint
// lands with the role-based UI later).
//
// Rationale: avoids the "baked-in env var" pattern and lets the operator
// pick their own password at first boot. Safe because the endpoint is
// self-closing after one successful call.
// ---------------------------------------------------------------------------

import { defineEventHandler, readBody, createError } from 'h3'
import { hash } from 'bcrypt-ts'
import { useDB } from '../../utils/db'
import { setDashboardSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const db = useDB()

  const existing = await db.dashboardUser.count()
  if (existing > 0) {
    throw createError({
      statusCode: 403,
      message: 'Registration is closed. An admin account already exists — ask an admin to invite you.',
    })
  }

  const body = await readBody<{ name?: string, email?: string, password?: string }>(event)
  if (!body?.name || !body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'name, email, and password are required' })
  }
  if (body.password.length < 10) {
    throw createError({ statusCode: 400, message: 'password must be at least 10 characters' })
  }

  const email = body.email.toLowerCase().trim()
  const passwordHash = await hash(body.password, 10)

  const user = await db.dashboardUser.create({
    data: {
      email,
      name: body.name.trim(),
      passwordHash,
      role: 'admin', // First user is always admin.
    },
  })

  await setDashboardSession(event, {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: 'admin',
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
})
