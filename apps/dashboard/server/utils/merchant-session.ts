// ---------------------------------------------------------------------------
// Merchant session — sealed h3 cookie for merchant-staff auth
// ---------------------------------------------------------------------------
//
// Carries the identity of a row in the merchant's own `admin_users` table
// (per-branch Prisma schema — see packages/platform/.../admin-user.prisma).
// Distinct from `cjs-dashboard-session` (platform-operator session, control
// DB, DashboardUser table).
//
// The cookie is **host-scoped** (no `domain` attribute set) so a session
// issued on `smoke.commercejs.cloud` is never sent to `other.commercejs.cloud`.
// The `merchantId` is still checked against `event.context.merchant.id` on
// every protected request as a second layer (see requireMerchantSession).
//
// Sealed with `NUXT_SESSION_PASSWORD` — the same secret as the dashboard
// session. The two don't collide because cookie names differ and scopes
// differ. In dev a deterministic fallback is used so cookies survive
// server restarts.
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'
import { resolveSessionPassword } from './sessionPassword'

export interface MerchantSession {
  /** admin_users.id on the merchant's Neon branch */
  userId: string
  /** Must match event.context.merchant.id on every protected request */
  merchantId: string
  email: string
  name: string | null
  role: 'owner' | 'admin' | 'editor'
}

const COOKIE_NAME = 'cjs-merchant-session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days — matches dashboard session

function sessionOptions() {
  return {
    password: resolveSessionPassword(),
    name: COOKIE_NAME,
    cookie: {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax' as const,
      maxAge: MAX_AGE_SECONDS,
      // No `domain` — browsers default to host-only, which is what we want.
    },
  }
}

/** Read the current merchant session. Returns null when no one is signed in. */
export async function getMerchantSession(event: H3Event): Promise<MerchantSession | null> {
  const session = await useSession<MerchantSession>(event, sessionOptions())
  if (!session.data?.userId) return null
  return session.data
}

/** Overwrite the session payload — call after a successful merchant login. */
export async function setMerchantSession(event: H3Event, data: MerchantSession): Promise<void> {
  const session = await useSession<MerchantSession>(event, sessionOptions())
  await session.update(data)
}

/** Clear the cookie — call from the logout endpoint. */
export async function clearMerchantSession(event: H3Event): Promise<void> {
  const session = await useSession<MerchantSession>(event, sessionOptions())
  await session.clear()
}
