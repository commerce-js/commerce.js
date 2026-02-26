// ---------------------------------------------------------------------------
// Armada Install Endpoint — handles the OAuth-like install redirect
// ---------------------------------------------------------------------------
// When a merchant clicks "Install" in the Armada Marketplace, they're
// redirected here with `app_id` and `installation_id`. We:
//   1. Verify the app_id matches our configured app
//   2. Generate an HMAC-SHA256 challenge signature using the app secret
//   3. Redirect the merchant to Armada's verification URL
//
// Docs: https://docs.armadadelivery.com/v1/setup-authentication/authentication/

import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import { createHmac } from 'node:crypto'

const ARMADA_VERIFY_URL = 'https://api.armadadelivery.com/integrations/apps/install/verify'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const appId = query.app_id as string | undefined
  const installationId = query.installation_id as string | undefined

  if (!appId || !installationId) {
    throw createError({
      statusCode: 400,
      message: 'Missing required query parameters: app_id and installation_id',
    })
  }

  // Verify this install request is for our app
  const config = useRuntimeConfig()
  const ourAppId = config.armadaAppId

  if (ourAppId && appId !== ourAppId) {
    throw createError({
      statusCode: 403,
      message: 'app_id does not match the configured Armada app',
    })
  }

  const appSecret = config.armadaAppSecret
  if (!appSecret) {
    throw createError({
      statusCode: 500,
      message: 'NUXT_ARMADA_APP_SECRET is not configured',
    })
  }

  // Generate HMAC-SHA256 challenge signature
  const challengeSignature = createHmac('sha256', appSecret)
    .update(installationId)
    .digest('hex')

  console.log(`[armada] Install redirect: installation_id=${installationId}`)

  // Redirect the merchant to Armada's verify endpoint
  const verifyUrl = `${ARMADA_VERIFY_URL}?installation_id=${encodeURIComponent(installationId)}&challenge_signature=${encodeURIComponent(challengeSignature)}`

  return sendRedirect(event, verifyUrl, 302)
})
