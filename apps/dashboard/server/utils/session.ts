// ---------------------------------------------------------------------------
// Session utility — sealed cookie-based sessions via h3
// ---------------------------------------------------------------------------

import type { H3Event } from 'h3'

export interface UserSession {
  userId: string
  githubToken: string
  githubUsername: string
}

/**
 * Get or create a sealed session from the request cookies.
 * Uses h3's `useSession()` with the session password from runtime config.
 */
export async function getUserSession(event: H3Event): Promise<UserSession | null> {
  const config = useRuntimeConfig()
  const session = await useSession<UserSession>(event, {
    password: config.sessionPassword || 'at-least-32-characters-long-dev-secret-key!!',
    name: 'cjs-session',
    cookie: {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  })

  if (!session.data?.userId) {
    return null
  }

  return session.data
}

/**
 * Set user session data after OAuth login.
 */
export async function setUserSession(event: H3Event, data: UserSession): Promise<void> {
  const config = useRuntimeConfig()
  const session = await useSession<UserSession>(event, {
    password: config.sessionPassword || 'at-least-32-characters-long-dev-secret-key!!',
    name: 'cjs-session',
    cookie: {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    },
  })

  await session.update(data)
}

/**
 * Clear the user session (logout).
 */
export async function clearUserSession(event: H3Event): Promise<void> {
  const config = useRuntimeConfig()
  const session = await useSession<UserSession>(event, {
    password: config.sessionPassword || 'at-least-32-characters-long-dev-secret-key!!',
    name: 'cjs-session',
  })

  await session.clear()
}
