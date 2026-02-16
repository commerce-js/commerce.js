// ---------------------------------------------------------------------------
// POST /api/merchants/[merchantId]/payment-config — Direct API key entry
// ---------------------------------------------------------------------------
// Allows merchants with existing Tap accounts to set their API keys directly.
// Validates the keys by making a test API call to Tap before saving.
// ---------------------------------------------------------------------------

import { saveMerchantConfig }  from '../../../utils/merchant-store'
import { invalidateMerchantProvider } from '../../../utils/tap'

export default defineEventHandler(async (event) => {
  const merchantId = getRouterParam(event, 'merchantId')
  if (!merchantId) {
    throw createError({ statusCode: 400, message: 'merchantId is required' })
  }

  const body = await readBody(event)

  if (!body?.tapSecretKey || !body?.tapPublicKey) {
    throw createError({
      statusCode: 400,
      message: 'tapSecretKey and tapPublicKey are required',
    })
  }

  // Validate key format
  if (!body.tapSecretKey.startsWith('sk_')) {
    throw createError({
      statusCode: 400,
      message: 'tapSecretKey must start with sk_test_ or sk_live_',
    })
  }
  if (!body.tapPublicKey.startsWith('pk_')) {
    throw createError({
      statusCode: 400,
      message: 'tapPublicKey must start with pk_test_ or pk_live_',
    })
  }

  // Validate the secret key by making a test API call to Tap
  try {
    const res = await fetch('https://api.tap.company/v2/charges?limit=1', {
      headers: {
        'Authorization': `Bearer ${body.tapSecretKey}`,
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw createError({
        statusCode: 422,
        message: `Tap API key validation failed (${res.status}): ${errorBody}`,
      })
    }
  }
  catch (err: any) {
    if (err.statusCode) throw err // re-throw our createError
    throw createError({
      statusCode: 422,
      message: `Could not validate Tap API keys: ${err.message}`,
    })
  }

  // Keys are valid — save to merchant store
  const config = await saveMerchantConfig({
    merchantId,
    tapSecretKey: body.tapSecretKey,
    tapPublicKey: body.tapPublicKey,
    tapMerchantId: body.tapMerchantId,
    onboardingMethod: 'direct',
    status: 'active',
  })

  // Invalidate any cached provider for this merchant (key rotation)
  invalidateMerchantProvider(merchantId)

  return {
    merchantId: config.merchantId,
    status: config.status,
    onboardingMethod: config.onboardingMethod,
    updatedAt: config.updatedAt,
  }
})
