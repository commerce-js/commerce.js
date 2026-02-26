// ---------------------------------------------------------------------------
// Armada Estimate Proxy — tests the estimate API using the stored token
// ---------------------------------------------------------------------------
// Proxies delivery estimates through the dashboard using the stored access token.
// Used for testing — in production, estimates go through the hosted checkout.

import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const storage = useStorage('data')
  const config = await storage.getItem('armada:config') as Record<string, any> | null

  if (!config?.accessToken) {
    throw createError({
      statusCode: 400,
      message: 'No Armada access token stored. Complete the install flow first.',
    })
  }

  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      message: 'Request body required with origin/destination coordinates',
    })
  }

  // Forward to Armada estimate API
  const response = await fetch('https://api.armadadelivery.com/v1/deliveries/estimate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Armada-Access-Token': config.accessToken,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    console.log(`[armada] Estimate failed: ${response.status}`, data)
    throw createError({
      statusCode: response.status,
      message: data?.message || 'Armada estimate failed',
    })
  }

  console.log('[armada] ✅ Estimate:', data)
  return data
})
