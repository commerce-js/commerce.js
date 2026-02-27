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
    // 1. Exchange code for access token
    // -------------------------------------------------------------------------
    const requestUrl = getRequestURL(event)
    const origin = `${requestUrl.protocol}//${requestUrl.host}`

    let tokenResponse: {
      access_token?: string
      token_type?: string
      scope?: string
      error?: string
      error_description?: string
    }

    try {
      tokenResponse = await $fetch('https://github.com/login/oauth/access_token', {
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
    }
    catch (fetchError: any) {
      throw createError({
        statusCode: 502,
        message: `Token exchange HTTP error: ${fetchError.status || fetchError.statusCode || 'unknown'} - ${fetchError.message}`,
      })
    }

    if (tokenResponse.error || !tokenResponse.access_token) {
      throw createError({
        statusCode: 401,
        message: `GitHub OAuth error: ${tokenResponse.error_description || tokenResponse.error || 'No access token returned'}`,
      })
    }

    const accessToken = tokenResponse.access_token

    // -------------------------------------------------------------------------
    // 2. Fetch GitHub user profile
    // -------------------------------------------------------------------------
    let ghUser: {
      id: number
      login: string
      name: string | null
      email: string | null
      avatar_url: string
    }

    try {
      ghUser = await $fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      })
    }
    catch (fetchError: any) {
      throw createError({
        statusCode: 502,
        message: `GitHub user API error: ${fetchError.status || fetchError.statusCode || 'unknown'} - ${fetchError.message}`,
      })
    }

    // -------------------------------------------------------------------------
    // 3. Upsert user in D1
    // -------------------------------------------------------------------------
    let db: ReturnType<typeof useDB>
    try {
      db = useDB()
    }
    catch (dbError: any) {
      throw createError({
        statusCode: 500,
        message: `D1 initialization error: ${dbError.message}`,
      })
    }

    const userId = `user_${ghUser.id}`

    try {
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
    }
    catch (queryError: any) {
      throw createError({
        statusCode: 500,
        message: `D1 query error: ${queryError.message}`,
      })
    }

    // -------------------------------------------------------------------------
    // 4. Set session and redirect to dashboard
    // -------------------------------------------------------------------------
    try {
      await setUserSession(event, {
        userId,
        githubToken: accessToken,
        githubUsername: ghUser.login,
      })
    }
    catch (sessionError: any) {
      throw createError({
        statusCode: 500,
        message: `Session error: ${sessionError.message}`,
      })
    }

    return sendRedirect(event, '/projects')
  }
  catch (error: any) {
    // If it's already a createError, rethrow with the original status
    if (error.statusCode) {
      throw error
    }
    // Catch-all for unexpected errors
    throw createError({
      statusCode: 500,
      message: `Unexpected callback error: ${error.message}`,
    })
  }
})
