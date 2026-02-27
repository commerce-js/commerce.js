// ---------------------------------------------------------------------------
// GET /api/auth/github — redirect to GitHub OAuth authorize page
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { clientId } = config.oauth.github

  if (!clientId) {
    throw createError({
      statusCode: 500,
      message: 'GitHub OAuth client ID not configured',
    })
  }

  // Derive the callback from the current request origin
  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`

  // Build the GitHub authorize URL
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo read:user user:email',
    redirect_uri: `${origin}/api/auth/github/callback`,
    state: crypto.randomUUID(), // CSRF protection
  })

  return sendRedirect(event, `https://github.com/login/oauth/authorize?${params}`)
})

