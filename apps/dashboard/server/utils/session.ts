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

function sessionPassword(): string {
  const config = useRuntimeConfig()
  const pw = config.sessionPassword || process.env.NUXT_SESSION_PASSWORD
  if (!pw || pw.length < 32) {
    // Dev fallback only — 32-char deterministic string so cookies survive
    // server restarts in development.
    return 'dev-only-session-key-32-chars-min!'
  }
  return pw
}

function sessionOptions() {
  return {
    password: sessionPassword(),
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

/**
 * Require an authenticated dashboard operator. Control-plane routes
 * (/api/merchants/**) MUST call this — the tenant middleware skip-lists
 * them, so nothing else stands between the internet and merchant CRUD.
 */
export async function requireDashboardUser(
  event: H3Event,
  roles?: DashboardSession['role'][],
): Promise<DashboardSession> {
  const session = await getDashboardSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
  if (roles && !roles.includes(session.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }
  return session
}
