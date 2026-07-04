// ---------------------------------------------------------------------------
// Dashboard session — sealed h3 cookie, email/password auth
// ---------------------------------------------------------------------------
//
// Sessions carry the platform operator's identity (DashboardUser row) —
// NOT a merchant customer. Role is either 'admin' (full control) or
// 'support' (read-oriented; enforcement is per-route).
//
// The sealed cookie is keyed by NUXT_SESSION_PASSWORD (must be ≥32 chars
// in production — see CLAUDE.md gotcha about cookie sealing).
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'

export interface DashboardSession {
  userId: string
  email: string
  name: string
  role: 'admin' | 'support'
}

const COOKIE_NAME = 'cjs-dashboard-session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

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

/** Read the current session. Returns null when no one is signed in. */
export async function getDashboardSession(event: H3Event): Promise<DashboardSession | null> {
  const session = await useSession<DashboardSession>(event, sessionOptions())
  if (!session.data?.userId) return null
  return session.data
}

/** Overwrite the session payload — call after a successful login. */
export async function setDashboardSession(event: H3Event, data: DashboardSession): Promise<void> {
  const session = await useSession<DashboardSession>(event, sessionOptions())
  await session.update(data)
}

/** Clear the cookie — call from the logout endpoint. */
export async function clearDashboardSession(event: H3Event): Promise<void> {
  const session = await useSession<DashboardSession>(event, sessionOptions())
  await session.clear()
}
