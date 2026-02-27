// ---------------------------------------------------------------------------
// GET /api/auth/github/callback — exchange code for token, upsert user
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../../utils/db'
import { setUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({ statusCode: 400, message: 'Missing authorization code' })
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Exchange code for access token (using native fetch for CF Workers compat)
    // -------------------------------------------------------------------------
    const requestUrl = getRequestURL(event)
    const origin = `${requestUrl.protocol}//${requestUrl.host}`

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.oauth.github.clientId,
        client_secret: config.oauth.github.clientSecret,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`,
      }).toString(),
    })

    if (!tokenRes.ok) {
      throw createError({
        statusCode: 502,
        message: `GitHub token exchange failed: HTTP ${tokenRes.status} ${tokenRes.statusText}`,
      })
    }

    const tokenData = await tokenRes.json() as {
      access_token?: string
      error?: string
      error_description?: string
    }

    if (tokenData.error || !tokenData.access_token) {
      throw createError({
        statusCode: 401,
        message: `GitHub OAuth error: ${tokenData.error_description || tokenData.error || 'No access token'}`,
      })
    }

    const accessToken = tokenData.access_token

    // -------------------------------------------------------------------------
    // 2. Fetch GitHub user profile (native fetch)
    // -------------------------------------------------------------------------
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'CommerceJS-Cloud',
      },
    })

    if (!userRes.ok) {
      throw createError({
        statusCode: 502,
        message: `GitHub user API failed: HTTP ${userRes.status} ${userRes.statusText}`,
      })
    }

    const ghUser = await userRes.json() as {
      id: number
      login: string
      name: string | null
      email: string | null
      avatar_url: string
    }

    // -------------------------------------------------------------------------
    // 3. Upsert user in D1
    // -------------------------------------------------------------------------
    const db = useDB()
    const userId = `user_${ghUser.id}`

    const [existing] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.githubId, ghUser.id))

    if (existing) {
      await db.update(schema.users)
        .set({
          githubAccessToken: accessToken,
          name: ghUser.name || ghUser.login,
          email: ghUser.email,
          avatarUrl: ghUser.avatar_url,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.users.id, existing.id))
    }
    else {
      await db.insert(schema.users).values({
        id: userId,
        email: ghUser.email,
        name: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url,
        githubId: ghUser.id,
        githubUsername: ghUser.login,
        githubAccessToken: accessToken,
      })
    }

    // -------------------------------------------------------------------------
    // 4. Set session and redirect to dashboard
    // -------------------------------------------------------------------------
    await setUserSession(event, {
      userId: existing?.id || userId,
      githubToken: accessToken,
      githubUsername: ghUser.login,
    })

    return sendRedirect(event, '/projects')
  }
  catch (error: any) {
    // If it's already a createError, rethrow
    if (error.statusCode) {
      throw error
    }
    // Unexpected errors — surface details
    throw createError({
      statusCode: 500,
      message: `Callback error: ${error.message || String(error)}`,
    })
  }
})
