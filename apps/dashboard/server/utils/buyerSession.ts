// ---------------------------------------------------------------------------
// Buyer session — sealed h3 cookie scoped to the storefront buyer
// ---------------------------------------------------------------------------
//
// This session is separate from the dashboard operator session
// (`cjs-dashboard-session`, see utils/session.ts). The buyer cookie rides on
// the merchant's subdomain / custom domain and carries only the minimum
// needed to follow a shopping journey across requests:
//
//   - customerId — set after login / register; unset after logout
//   - cartId     — created lazily when the buyer first hits GET /cart or
//                  POST /cart/items, then retained until checkout completes
//
// Merchant-specific customer state (profile, orders) is resolved via the
// tenant-bound `event.context.admin` API using the ID in the session.
// We do NOT rely on `event.context.adapter`'s in-memory customer state
// (the platform's customers domain holds that in a singleton that is
// shared across concurrent requests — unsafe for multi-tenant EaaS).
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'

export interface BuyerSession {
  customerId?: string
  cartId?: string
}

const COOKIE_NAME = 'cjs-buyer-session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days — shoppers often return

function sessionOptions() {
  return {
    // Fail-closed in prod — see server/utils/sessionSeal.ts.
    password: resolveSessionPassword(),
    name: COOKIE_NAME,
    cookie: {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax' as const,
      maxAge: MAX_AGE_SECONDS,
    },
  }
}

/** Read the buyer session. Always returns an object (possibly empty). */
export async function getBuyerSession(event: H3Event): Promise<BuyerSession> {
  const session = await useSession<BuyerSession>(event, sessionOptions())
  return session.data || {}
}

/** Merge `patch` onto the existing session. */
export async function updateBuyerSession(event: H3Event, patch: Partial<BuyerSession>): Promise<BuyerSession> {
  const session = await useSession<BuyerSession>(event, sessionOptions())
  const next = { ...(session.data || {}), ...patch }
  await session.update(next)
  return next
}

/** Replace the session payload entirely — used after login/register/logout. */
export async function setBuyerSession(event: H3Event, data: BuyerSession): Promise<void> {
  const session = await useSession<BuyerSession>(event, sessionOptions())
  await session.update(data)
}

/** Clear the buyer cookie. */
export async function clearBuyerSession(event: H3Event): Promise<void> {
  const session = await useSession<BuyerSession>(event, sessionOptions())
  await session.clear()
}

/**
 * Require an authenticated buyer (session.customerId).
 * Throws 401 if missing.
 */
export async function requireBuyer(event: H3Event): Promise<{ customerId: string, cartId?: string }> {
  const session = await getBuyerSession(event)
  if (!session.customerId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'You must be signed in to access this resource.',
    })
  }
  return { customerId: session.customerId, cartId: session.cartId }
}
