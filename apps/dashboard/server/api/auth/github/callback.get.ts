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

  // ---------------------------------------------------------------------------
  // 1. Exchange code for access token
  // ---------------------------------------------------------------------------
  const tokenResponse = await $fetch<{
    access_token: string
    token_type: string
    scope: string
  }>('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      client_id: config.oauth.github.clientId,
      client_secret: config.oauth.github.clientSecret,
      code,
    },
  })

  if (!tokenResponse.access_token) {
    console.error('[auth/github] Token exchange failed:', tokenResponse)
    throw createError({ statusCode: 401, message: 'Failed to exchange authorization code' })
  }

  const accessToken = tokenResponse.access_token

  // ---------------------------------------------------------------------------
  // 2. Fetch GitHub user profile
  // ---------------------------------------------------------------------------
  const ghUser = await $fetch<{
    id: number
    login: string
    name: string | null
    email: string | null
    avatar_url: string
  }>('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  })

  // ---------------------------------------------------------------------------
  // 3. Upsert user in D1
  // ---------------------------------------------------------------------------
  const db = useDB()
  const userId = `user_${ghUser.id}`

  const [existing] = await db.select()
    .from(schema.users)
    .where(eq(schema.users.githubId, ghUser.id))

  if (existing) {
    // Update token and profile info
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
    // Create new user
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

  // ---------------------------------------------------------------------------
  // 4. Set session and redirect to dashboard
  // ---------------------------------------------------------------------------
  await setUserSession(event, {
    userId: existing?.id || userId,
    githubToken: accessToken,
    githubUsername: ghUser.login,
  })

  return sendRedirect(event, '/projects')
})
