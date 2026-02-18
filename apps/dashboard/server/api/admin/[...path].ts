// ---------------------------------------------------------------------------
// Admin API proxy — forwards dashboard requests to the storefront
// ---------------------------------------------------------------------------
// Routes: GET/POST/PATCH/DELETE /api/admin/**
// Forwards to: {storeUrl}/_commerce/admin/**
//
// The storefront URL comes from the `_storeUrl` query param (stripped before
// forwarding). In production this would be validated against the user's
// allowed stores and authenticated with a server-side token.

import { defineEventHandler, getQuery, readBody, getMethod, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const params = event.context.params as { path?: string }
  const path = params?.path || ''

  const query = { ...getQuery(event) } as Record<string, any>
  const storeUrl = (query._storeUrl as string) || process.env.NUXT_STOREFRONT_URL || ''
  delete query._storeUrl

  if (!storeUrl) {
    throw createError({
      statusCode: 400,
      message: 'Missing _storeUrl query parameter or NUXT_STOREFRONT_URL env var',
    })
  }

  const method = getMethod(event)
  const targetUrl = `${storeUrl}/api/_commerce/admin/${path}`

  const fetchOptions: any = {
    method,
    query,
    headers: {
      'Content-Type': 'application/json',
      // In production, inject a real admin auth token here
      // For dev, the storefront admin-auth middleware may allow bypass
      'X-Admin-Key': process.env.COMMERCE_ADMIN_KEY || 'dev-admin-key',
    },
  }

  // Forward body for non-GET requests
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      fetchOptions.body = await readBody(event)
    } catch {
      // No body — that's fine
    }
  }

  try {
    const response = await $fetch(targetUrl, fetchOptions)
    return response
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.response?.status || 502
    const message = err?.data?.message || err?.message || 'Failed to reach storefront'

    throw createError({
      statusCode,
      message: `Admin API proxy error: ${message}`,
    })
  }
})
