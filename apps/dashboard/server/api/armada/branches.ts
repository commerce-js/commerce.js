// ---------------------------------------------------------------------------
// Armada Branches Proxy — list/create branches using stored token
// ---------------------------------------------------------------------------
// GET  → list all branches
// POST → create a new branch

import { defineEventHandler, getMethod, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const storage = useStorage('data')
  const config = await storage.getItem('armada:config') as Record<string, any> | null

  if (!config?.accessToken) {
    throw createError({ statusCode: 400, message: 'No Armada access token. Install first.' })
  }

  const method = getMethod(event)
  const headers = {
    'Content-Type': 'application/json',
    'Armada-Access-Token': config.accessToken,
  }

  if (method === 'GET') {
    const res = await fetch('https://api.armadadelivery.com/v1/branches', { headers })
    return res.json()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const res = await fetch('https://api.armadadelivery.com/v1/branches', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      throw createError({ statusCode: res.status, message: (data as any)?.message || 'Failed to create branch' })
    }
    return data
  }
})
